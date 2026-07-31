/**
 * Sign out.
 *
 * Accepts GET so it can stay a plain link in the header — but gated on the
 * Sec-Fetch metadata, because "GET that changes state" has two live callers we
 * do not want.
 *
 * What was checked and is NOT a risk: a cross-site `<img src=".../admin/esci">`
 * cannot end the session. The clearing `Set-Cookie` carries no `SameSite`, which
 * browsers treat as Lax-by-default, and Lax blocks a cookie *write* from a
 * cross-site subresource exactly as it blocks a read. Link-preview crawlers
 * (WhatsApp, iMessage) have no cookie jar of his at all.
 *
 * What is real: a same-site speculative prefetch — Safari and Chrome both
 * prefetch links the user is about to tap — would log him out silently, and a
 * top-level navigation from anywhere still counts. On a phone-only user with no
 * password reset, "logged out for no reason" is a support call to Leo, so the
 * four lines are worth it.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { clearSession } from '../../lib/admin/session';

export const GET: APIRoute = ({ request, cookies, redirect }) => {
  const headers = request.headers;
  const site = headers.get('sec-fetch-site');
  const mode = headers.get('sec-fetch-mode');
  // `Sec-Purpose: prefetch` (and the older `Purpose: prefetch`) is what a
  // speculative load announces itself with.
  const speculative = /prefetch|prerender/i.test(
    `${headers.get('sec-purpose') ?? ''} ${headers.get('purpose') ?? ''}`,
  );

  // Absent Sec-Fetch headers mean an old browser or a non-browser client; those
  // are allowed through so the link never stops working for a real person.
  const genuineTap =
    !speculative && (site === null || site === 'same-origin') && (mode === null || mode === 'navigate');

  if (!genuineTap) {
    return redirect('/admin');
  }

  clearSession(cookies);
  return redirect('/admin/entra');
};

export const POST: APIRoute = ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect('/admin/entra');
};
