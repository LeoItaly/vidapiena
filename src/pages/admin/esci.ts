/**
 * Sign out.
 *
 * Accepts GET so it can be a plain link in the header — there is no CSRF risk
 * worth a POST here: the only thing an attacker could force is logging Francesco
 * out, and his session is restored by one tap on a keychain-filled form.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { clearSession } from '../../lib/admin/session';

export const GET: APIRoute = ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect('/admin/entra');
};

export const POST: APIRoute = ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect('/admin/entra');
};
