/**
 * Login attempt throttling.
 *
 * ## Why this is no longer a KV counter
 *
 * The first version counted failed logins in KV. That made the throttle itself
 * the attack, for four compounding reasons:
 *
 * 1. **One KV write per failed attempt**, against a free-plan budget of 1,000 per
 *    day — shared with photo uploads and (from stage 4) draft autosave.
 * 2. **`cf-connecting-ip` carries a full IPv6 address**, and any commodity VPS
 *    ships with a /64. That is 2^64 distinct `login-fail:<ip>` buckets, each
 *    entitled to its own 10 writes, so the 10-attempt cap never engaged and an
 *    unauthenticated caller could spend the day's writes in seconds.
 * 3. **KV reads are edge-cached for 60 s by default, negative lookups included**,
 *    and the increment was a non-atomic read-modify-write — so concurrent
 *    attempts all read the same stale count and all wrote the same value.
 * 4. **The over-quota error was swallowed** by a `catch {}` whose comment called
 *    throttling best-effort. Once the quota was gone the limiter reported "not
 *    blocked" forever: it failed open on exactly the input designed to break it,
 *    while Francesco's uploads and drafts silently stopped saving.
 *
 * The Rate Limiting binding has none of those properties: it is edge-local,
 * consumes no KV writes and has no daily quota. The check also runs *before*
 * PBKDF2, so a throttled attempt costs no crypto against the 10 ms CPU budget.
 *
 * The trade is the window: the binding accepts only 10 or 60 second periods, so
 * the 15-minute lockout is now one minute. For this deployment that is strictly
 * better — the passphrase is ~62 bits of generated entropy, so the window was
 * never what stopped guessing, and a mistyped passphrase on a phone keyboard no
 * longer costs the only user a quarter of an hour.
 */

/** The slice of the KV binding the back office uses — structural, so no workers-types dependency. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/** The slice of the Rate Limiting binding we use. */
export interface RateLimiterLike {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * Folds a client address to the unit a person actually controls.
 *
 * An IPv4 address is one host. An IPv6 address is one of at least 2^64 that the
 * same customer was handed, so throttling the full address throttles nothing —
 * the attacker simply binds the next one. /64 is the standard smallest
 * assignment and therefore the right bucket.
 *
 * Rate limiting by prefix does mean two people behind one IPv6 /64 share a
 * bucket. With two accounts on this portal that is not a real cost.
 */
export function ipBucket(ip: string): string {
  if (!ip.includes(':')) return ip;

  // Expand `::` so the first four groups are genuinely the first four.
  const [head = '', tail = ''] = ip.split('%')[0]!.split('::');
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail ? tail.split(':') : [];
  const missing = 8 - headGroups.length - tailGroups.length;
  const groups = ip.includes('::')
    ? [...headGroups, ...Array<string>(Math.max(0, missing)).fill('0'), ...tailGroups]
    : ip.split(':');

  return `${groups
    .slice(0, 4)
    .map((g) => (g || '0').toLowerCase().padStart(4, '0'))
    .join(':')}::/64`;
}

export interface RateLimitState {
  /** False when this caller has made too many recent attempts. */
  allowed: boolean;
  /**
   * True when no limiter was available and the request was let through.
   *
   * Surfaced rather than hidden: the previous implementation's silent fail-open
   * is the specific bug this file exists to not repeat. It is logged, and the
   * password's entropy is what carries the risk in the meantime.
   */
  degraded: boolean;
}

/**
 * Never throws. A missing binding lets the request through — failing closed here
 * would lock the only user out of his own site over a platform hiccup, and there
 * is no password reset — but it says so out loud.
 */
export async function checkLoginRate(
  limiter: RateLimiterLike | null,
  ip: string,
): Promise<RateLimitState> {
  if (!limiter) {
    console.warn('[admin] no rate-limit binding — login throttling is not active');
    return { allowed: true, degraded: true };
  }
  try {
    const { success } = await limiter.limit({ key: `login:${ipBucket(ip)}` });
    return { allowed: success, degraded: false };
  } catch (err) {
    console.warn('[admin] rate-limit check failed:', err instanceof Error ? err.message : err);
    return { allowed: true, degraded: true };
  }
}
