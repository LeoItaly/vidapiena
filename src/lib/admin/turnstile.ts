/**
 * Cloudflare Turnstile verification.
 *
 * Managed mode is free and unlimited, and it is what stops automated credential
 * stuffing against the login form. src/lib/admin/rate-limit.ts is the backstop for
 * requests that skip the form entirely.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: 'missing-token' | 'rejected' | 'unreachable' };

/**
 * `secret` unset means Turnstile is not configured. That is allowed in local dev
 * (there are no keys without a Cloudflare account) but the caller must refuse to
 * skip the check in production — see src/pages/admin/entra.astro.
 */
export async function verifyTurnstile(
  secret: string | undefined,
  token: string | undefined,
  ip: string,
): Promise<TurnstileResult> {
  if (!secret) return { ok: true };
  if (!token) return { ok: false, reason: 'missing-token' };

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip !== 'unknown') body.append('remoteip', ip);

  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    if (!response.ok) return { ok: false, reason: 'unreachable' };

    const data = (await response.json()) as { success?: boolean };
    return data.success === true ? { ok: true } : { ok: false, reason: 'rejected' };
  } catch {
    // Fail closed. If we cannot reach Cloudflare we cannot tell a human from a
    // bot, and the person who needs to log in can retry in a moment.
    return { ok: false, reason: 'unreachable' };
  }
}
