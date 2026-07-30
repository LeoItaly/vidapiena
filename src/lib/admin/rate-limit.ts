/**
 * Login attempt throttling.
 *
 * Turnstile is the primary defence (it stops form-level credential stuffing); this
 * is the backstop for direct POSTs that never render the form. KV is only written
 * on *failed* attempts, which keeps this well clear of the free plan's 1,000
 * writes/day — a legitimate user logging in once a year costs zero writes.
 *
 * KV is eventually consistent, so a determined attacker firing many requests in
 * parallel can slip a few past the counter before it converges. That is accepted:
 * the credential is a generated high-entropy passphrase, so a handful of extra
 * guesses buys nothing, and Turnstile is in front.
 */

/** The slice of the KV binding we use — structural, so no workers-types dependency. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 10;

function key(ip: string): string {
  return `login-fail:${ip}`;
}

export interface RateLimitState {
  blocked: boolean;
  attempts: number;
  remaining: number;
}

/**
 * Never throws. If KV is unavailable (local dev without a binding, or a transient
 * failure) this reports "not blocked" rather than locking the real user out of his
 * own site — Turnstile still stands in front of the form.
 */
export async function checkRateLimit(kv: KVLike | null, ip: string): Promise<RateLimitState> {
  if (!kv) return { blocked: false, attempts: 0, remaining: MAX_ATTEMPTS };

  try {
    const attempts = Number.parseInt((await kv.get(key(ip))) ?? '0', 10) || 0;
    return {
      blocked: attempts >= MAX_ATTEMPTS,
      attempts,
      remaining: Math.max(0, MAX_ATTEMPTS - attempts),
    };
  } catch {
    return { blocked: false, attempts: 0, remaining: MAX_ATTEMPTS };
  }
}

/**
 * `known` is the count the caller already read via checkRateLimit on this same
 * request. Passing it avoids a second KV read per failed login — the read costs
 * nothing against the write quota, but it is a round trip inside a 10 ms CPU
 * budget for a number we already have.
 */
export async function recordFailure(
  kv: KVLike | null,
  ip: string,
  known?: number,
): Promise<void> {
  if (!kv) return;
  try {
    const attempts =
      known ?? (Number.parseInt((await kv.get(key(ip))) ?? '0', 10) || 0);
    // Re-setting expirationTtl on every failure makes this a sliding window: the
    // block only lifts after 15 quiet minutes, not 15 minutes after the first try.
    await kv.put(key(ip), String(attempts + 1), { expirationTtl: WINDOW_SECONDS });
  } catch {
    // Throttling is best-effort; a KV hiccup must not turn into a failed login page.
  }
}

export async function clearFailures(kv: KVLike | null, ip: string): Promise<void> {
  if (!kv) return;
  try {
    await kv.delete(key(ip));
  } catch {
    // Same reasoning: a stale counter expires on its own within the window.
  }
}
