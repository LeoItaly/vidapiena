/**
 * Back-office guard.
 *
 * Protection lives here rather than in each page so that adding a route under
 * /admin cannot accidentally ship unprotected. The public site is untouched: every
 * other path returns immediately, and all public pages are prerendered anyway so
 * this never runs for them in production.
 */

import { defineMiddleware } from 'astro:middleware';
import { ADMIN_USERS, SESSION_SECRET } from 'astro:env/server';
import { resolveSession, needsRenewal, renewSession, parseUsers } from './lib/admin/session';
import { isUsableSecret } from './lib/admin/crypto';
import { isSecureRequest } from './lib/admin/runtime';

/** Reachable without a session. Everything else under /admin requires one. */
const PUBLIC_ADMIN_PATHS = ['/admin/entra', '/admin/esci'];

/**
 * Routes the editor calls with fetch() rather than navigates to.
 *
 * These must fail with a status the caller can branch on. A 302 to an HTML login
 * page is followed transparently by fetch, so the editor would receive `res.ok`
 * with a login form as the body and report a successful save of an article that
 * was never saved — the worst possible outcome for a user who cannot check.
 */
const API_PREFIX = '/admin/api/';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/admin')) return next();

  // A login page has no business in a search index, and neither does anything
  // behind it. Set it for the whole area in one place.
  const response = await (async () => {
    if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname === `${p}/`)) {
      return next();
    }

    const isApi = pathname.startsWith(API_PREFIX);
    const deny = (reason: string, status: number) =>
      isApi
        ? new Response(JSON.stringify({ errore: reason }), {
            status,
            headers: { 'content-type': 'application/json; charset=utf-8' },
          })
        : context.redirect(`/admin/entra${reason === 'configurazione' ? '?errore=configurazione' : ''}`);

    // Fail closed: without a usable signing secret no token can be trusted, and
    // without any users nobody can be authenticated. Either way, send them to the
    // login rather than rendering the back office.
    //
    // `isUsableSecret`, not a truthiness check: importKey accepts a 1-byte HMAC
    // key without complaint, so a truncated or hand-typed secret would silently
    // become a brute-forcible signing key while everything appeared to work.
    const secret = SESSION_SECRET;
    const users = parseUsers(ADMIN_USERS);
    if (!isUsableSecret(secret) || users.length === 0) {
      return deny('configurazione', 503);
    }

    const session = await resolveSession(context.cookies, secret, users);
    if (!session) {
      return deny('non-autenticato', 401);
    }

    // Slide the expiry forward for an active user so the cookie never lapses
    // under someone who uses the site regularly. Renewed against the live user
    // record, so a rotated credential cannot be carried forward by renewal.
    if (needsRenewal(session.payload)) {
      await renewSession(context.cookies, session.user, secret, isSecureRequest(context));
    }

    context.locals.admin = { email: session.user.email, name: session.user.name };
    return next();
  })();

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
});
