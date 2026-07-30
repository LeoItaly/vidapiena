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
import { signToken, verifyToken, verifyPassword } from './crypto';

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
}

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
    return parsed.filter((u): u is AdminUser => {
      if (typeof u !== 'object' || u === null) return false;
      const c = u as Record<string, unknown>;
      return (
        typeof c.email === 'string' &&
        typeof c.name === 'string' &&
        typeof c.hash === 'string' &&
        c.email.length > 0 &&
        c.hash.startsWith('pbkdf2$')
      );
    });
  } catch {
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
    { sub: user.email, name: user.name, iat: now, exp: now + YEAR_SECONDS } satisfies SessionPayload,
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

export async function renewSession(
  cookies: AstroCookies,
  payload: SessionPayload,
  secret: string,
  isSecure: boolean,
): Promise<void> {
  await issueSession(
    cookies,
    { email: payload.sub, name: payload.name, hash: '' },
    secret,
    isSecure,
  );
}
