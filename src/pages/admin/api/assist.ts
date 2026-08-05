/**
 * On-demand AI help for the editor. Today: suggest a Riassunto (meta description).
 *
 * ⚠️ `prerender = false` is load-bearing (see scrivi.astro / verify-build.mjs):
 * without it this route is emitted as a static file in front of the Worker and the
 * middleware guard never runs. Auth + CSRF are as in the other /admin/api routes —
 * middleware answers 401 JSON for /admin/api/*, and Astro's checkOrigin covers CSRF.
 *
 * The article text is sent in the request (not read from KV) so the suggestion is
 * made from what he is typing right now, not the last autosave.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { suggestDescription } from '../../../lib/admin/assist';
import type { WorkersAI } from '../../../lib/admin/translate';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/**
 * The body ceiling, checked BEFORE parsing.
 *
 * Only 8 000 characters of the article are ever used, but `request.json()` costs
 * CPU proportional to what it is handed — and the free plan allows 10 ms of active
 * CPU per request. A draft may legally hold megabytes (400 blocks × 20 000 chars,
 * see draft-store.ts), so an unbounded parse here is the classic version of this
 * platform's worst bug: `wrangler dev` does not enforce the CPU limit, so it passes
 * every local test and returns error 1102 for 100% of real requests. Comfortably
 * above the ~16 KB the capped payload actually needs.
 */
const MAX_BODY_BYTES = 64 * 1024;

export const POST: APIRoute = async (context) => {
  const declared = Number(context.request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) {
    return json(
      { ok: false, errore: 'L’articolo è troppo lungo per una proposta automatica. Scrivi tu il riassunto.' },
      413,
    );
  }

  let body: { titolo?: unknown; testo?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return json({ ok: false, errore: 'Richiesta non valida.' }, 400);
  }

  const titolo = typeof body.titolo === 'string' ? body.titolo.slice(0, 300) : '';
  const testo = typeof body.testo === 'string' ? body.testo.slice(0, 8000) : '';

  const ai = (env as unknown as { AI?: WorkersAI }).AI ?? null;
  const riassunto = await suggestDescription(ai, titolo, testo);

  // A miss is not an error he can act on differently — return a calm 200 with a
  // sentence he can read, and let him write the description himself.
  if (!riassunto) {
    return json({
      ok: false,
      errore: 'Non riesco a proporre un riassunto adesso. Riprova, oppure scrivilo tu.',
    });
  }
  return json({ ok: true, riassunto });
};
