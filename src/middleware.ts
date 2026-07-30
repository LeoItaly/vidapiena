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
import { readSession, needsRenewal, renewSession, parseUsers } from './lib/admin/session';
import { isSecureRequest } from './lib/admin/runtime';

/** Reachable without a session. Everything else under /admin requires one. */
const PUBLIC_ADMIN_PATHS = ['/admin/entra', '/admin/esci'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/admin')) return next();

  // A login page has no business in a search index, and neither does anything
  // behind it. Set it for the whole area in one place.
  const response = await (async () => {
    if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname === `${p}/`)) {
      return next();
    }

    // Fail closed: without a signing secret no token can be trusted, and without
    // any users nobody can be authenticated. Either way, send them to the login
    // rather than rendering the back office.
    const secret = SESSION_SECRET;
    if (!secret || parseUsers(ADMIN_USERS).length === 0) {
      return context.redirect('/admin/entra?errore=configurazione');
    }

    const session = await readSession(context.cookies, secret);
    if (!session) {
      return context.redirect('/admin/entra');
    }

    // Slide the expiry forward for an active user so the cookie never lapses
    // under someone who uses the site regularly.
    if (needsRenewal(session)) {
      await renewSession(context.cookies, session, secret, isSecureRequest(context));
    }

    context.locals.admin = { email: session.sub, name: session.name };
    return next();
  })();

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
});
