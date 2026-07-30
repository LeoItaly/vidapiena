/**
 * Who is logged into the back office, and for how long.
 *
 * Francesco must effectively never see a login screen again after the first time:
 * he is phone-only, his password lives in his phone's keychain, and there is no
 * email recovery path (his Outlook mailbox is full, so a magic link is the one
 * mechanism guaranteed to fail him — see docs/HOSTING.md). Hence a one-year
 * cookie with sliding renewal.
 */

import type { AstroCookies } from 'astro';
import { signToken, verifyToken, verifyPassword, credentialFingerprint } from './crypto';

export const SESSION_COOKIE = 'vp_admin';

const YEAR_SECONDS = 60 * 60 * 24 * 365;
/** Re-issue once under 300 days remain, so an active user's cookie never lapses. */
const RENEW_BELOW_SECONDS = 60 * 60 * 24 * 300;

export interface AdminUser {
  /** Login identifier. */
  email: string;
  /** Display name, and the git commit author for what this person publishes. */
  name: string;
  /** `pbkdf2$…` — never the password itself. */
  hash: string;
}

export interface SessionPayload {
  sub: string;
  name: string;
  iat: number;
  exp: number;
  /**
   * Fingerprint of the password hash this session was issued against. Absent on
   * tokens minted before credential binding existed, which are treated as stale
   * and rejected — a one-off re-login, not a failure mode.
   */
  v?: string;
}

/**
 * A well-formed stored hash: `pbkdf2$<iterations>$<salt b64>$<key b64>`.
 *
 * Checked here rather than only at verification time because the two failures are
 * indistinguishable downstream: verifyPassword returns plain `false` for a corrupt
 * hash, exactly as it does for a wrong password. Francesco would be told his
 * password is wrong, forever, for a problem in a secret he cannot see. Rejecting
 * the record here instead drops the user count to zero, which routes to the
 * already-written Italian "non ancora configurato — scrivi a Leo" message.
 */
const HASH_SHAPE = /^pbkdf2\$\d{1,7}\$[A-Za-z0-9+/]{16,}={0,2}\$[A-Za-z0-9+/]{40,}={0,2}$/;

/**
 * The ADMIN_USERS secret is JSON: `[{"email","name","hash"}]`.
 *
 * Fails closed. A missing or malformed secret yields no users, so every login is
 * rejected — a misconfigured deploy must never become an open door.
 */
export function parseUsers(raw: string | undefined): AdminUser[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u, i): u is AdminUser => {
      if (typeof u !== 'object' || u === null) return false;
      const c = u as Record<string, unknown>;
      const ok =
        typeof c.email === 'string' &&
        typeof c.name === 'string' &&
        typeof c.hash === 'string' &&
        c.email.length > 0 &&
        HASH_SHAPE.test(c.hash);
      if (!ok) {
        // The only diagnostic in the whole back office. Observability is enabled
        // in wrangler.jsonc, so this is the difference between Leo reading one
        // log line and debugging a "wrong password" report from Rio by guesswork.
        // Index and reason only — never the hash, never the email.
        console.warn(`[admin] ADMIN_USERS entry ${i} rejected: malformed record or hash`);
      }
      return ok;
    });
  } catch {
    console.warn('[admin] ADMIN_USERS is not valid JSON — nobody can log in');
    return [];
  }
}

/**
 * Verifies a password against the user list.
 *
 * When the email is unknown this still runs one PBKDF2 pass against a dummy hash,
 * so "no such user" and "wrong password" take the same time and cannot be told
 * apart by an attacker probing which accounts exist.
 */
export async function authenticate(
  users: AdminUser[],
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const normalised = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalised);

  if (!user) {
    // Prefer a real stored hash so the decoy costs exactly what a real check costs.
    // The literal fallback must keep the same iteration count as everything else:
    // a higher one would both blow the 10 ms CPU budget and make "unknown email"
    // measurably slower than "wrong password" — the very leak this guards against.
    const decoy =
      users[0]?.hash ??
      'pbkdf2$20000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    await verifyPassword(password, decoy);
    return null;
  }

  return (await verifyPassword(password, user.hash)) ? user : null;
}

export async function issueSession(
  cookies: AstroCookies,
  user: AdminUser,
  secret: string,
  isSecure: boolean,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await signToken(
    {
      sub: user.email,
      name: user.name,
      iat: now,
      exp: now + YEAR_SECONDS,
      v: await credentialFingerprint(user.hash),
    } satisfies SessionPayload,
    secret,
  );

  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Off on plain-HTTP localhost, or the browser silently drops the cookie and
    // local login appears to "work" while never staying logged in.
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: YEAR_SECONDS,
  });
}

export function clearSession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

/**
 * Reads and validates the cookie. Returns null for absent, tampered, or expired
 * tokens alike — the caller cannot distinguish them, and does not need to.
 */
export async function readSession(
  cookies: AstroCookies,
  secret: string,
): Promise<SessionPayload | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken<SessionPayload>(token, secret);
  if (!payload || typeof payload.exp !== 'number' || typeof payload.sub !== 'string') return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return payload;
}

export function needsRenewal(payload: SessionPayload): boolean {
  return payload.exp - Math.floor(Date.now() / 1000) < RENEW_BELOW_SECONDS;
}

/**
 * Renews against the *current* user record, not against the old token.
 *
 * The previous version rebuilt an AdminUser out of the expiring token
 * (`{ email: payload.sub, name: payload.name, hash: '' }`) — the empty hash being
 * the tell that the credential store was never consulted. That made the session
 * self-perpetuating: it re-signed itself every ~65 days from its own contents,
 * for a year at a time, forever, and no change to ADMIN_USERS could interrupt it.
 */
export async function renewSession(
  cookies: AstroCookies,
  user: AdminUser,
  secret: string,
  isSecure: boolean,
): Promise<void> {
  await issueSession(cookies, user, secret, isSecure);
}

/**
 * The single way to answer "who is making this request", used by both the
 * middleware and the login page.
 *
 * Deliberately one function: when the guard and the login screen disagree about
 * whether a cookie is valid, the result is a redirect loop between them — the
 * guard bounces you to the login, the login decides you are already signed in and
 * bounces you back. Sharing this makes that structurally impossible.
 *
 * A session is valid only if the signature holds, it has not expired, the subject
 * is *still* in ADMIN_USERS, and the credential fingerprint still matches. The
 * last two are what turn "rotate his password" and "delete the user" into real
 * revocation instead of paperwork.
 */
export async function resolveSession(
  cookies: AstroCookies,
  secret: string,
  users: AdminUser[],
): Promise<{ payload: SessionPayload; user: AdminUser } | null> {
  const payload = await readSession(cookies, secret);
  if (!payload) return null;

  const user = users.find((u) => u.email.toLowerCase() === payload.sub.toLowerCase());
  if (!user) return null;

  if (payload.v !== (await credentialFingerprint(user.hash))) return null;

  return { payload, user };
}
