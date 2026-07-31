/**
 * The draft an article is written into, and the list of them.
 *
 * Authentication is guaranteed by src/middleware.ts, which answers 401 **JSON**
 * for /admin/api/* rather than redirecting — a 302 to the login page is followed
 * transparently by `fetch`, so the editor would read a failed autosave as a
 * success and Francesco would keep typing into something that stopped saving.
 *
 * CSRF is covered by Astro's `security.checkOrigin` (on by default in 7.x, and
 * verified against this deployment: a POST with no Origin header gets 403). No
 * token machinery is therefore needed, and none is added — a token he could get
 * out of sync with is one more way to be locked out of his own site.
 *
 * ## Write budget
 * Every POST here is one of the 1,000 KV writes the free plan allows per day,
 * shared with photo uploads and the login rate limiter. The editor is what keeps
 * that under control: it saves to localStorage continuously and calls this only
 * on a long interval, on `pagehide`, and when he taps "Salva". This route
 * additionally refuses a write that would not change anything.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getKV } from '../../../lib/admin/runtime';
import { asListable, type DraftMetadata } from '../../../lib/admin/kv-list';
import {
  DRAFT_ID,
  draftKey,
  getDraft,
  newDraftId,
  ownership,
  sanitiseDraft,
  photoIndexKey,
  getPhotoIndex,
  type DraftDoc,
} from '../../../lib/admin/draft-store';
import { photoKey } from '../../../lib/admin/photo-store';

/** Italian: every one of these can reach Francesco unchanged. */
const ERRORI = {
  archivio: 'Non riesco a salvare in questo momento. Il testo resta sul telefono: riprova fra poco.',
  bozzaIgnota: 'Questa bozza non esiste più.',
  altrui: 'Questa bozza è di un altro account.',
  malformata: 'Non sono riuscito a leggere il testo. Riprova.',
  troppoGrande: 'Questo articolo è troppo lungo. Prova a dividerlo in due.',
} as const;

/** Comfortably above any real article, far below anything that costs CPU. */
const MAX_BODY_BYTES = 512 * 1024;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Nothing behind the login may sit in a shared cache or in the phone's
      // back-forward cache. These are per-user drafts.
      'cache-control': 'no-store',
    },
  });

const fail = (errore: string, status: number) => json({ ok: false, errore }, status);

export const GET: APIRoute = async (context) => {
  const kv = asListable(getKV());
  if (!kv) return fail(ERRORI.archivio, 503);
  const email = context.locals.admin?.email ?? '';

  const id = context.url.searchParams.get('id');

  if (id) {
    if (!DRAFT_ID.test(id)) return fail(ERRORI.bozzaIgnota, 400);
    const doc = await getDraft(kv, id);
    if (!doc) return fail(ERRORI.bozzaIgnota, 404);
    if (ownership(doc.owner, email) === 'altrui') return fail(ERRORI.altrui, 403);
    const index = await getPhotoIndex(kv, id);
    return json({ ok: true, id, doc, foto: index?.ids ?? [] });
  }

  // The article list. One `list` call plus the metadata each put attached — no
  // per-draft read, so this stays cheap even with the whole back catalogue.
  const { keys } = await kv.list({ prefix: 'draft:', limit: 1000 });
  const bozze = keys
    .filter((k) => k.name.endsWith(':doc') && k.metadata)
    .map((k) => ({
      id: k.name.slice('draft:'.length, -':doc'.length),
      titolo: k.metadata!.title,
      aggiornata: k.metadata!.updatedAt,
      slug: k.metadata!.slug ?? null,
      mia: (k.metadata!.owner ?? '').toLowerCase() === email.toLowerCase(),
    }))
    .filter((b) => b.mia)
    .sort((a, b) => b.aggiornata - a.aggiornata);

  return json({ ok: true, bozze });
};

export const POST: APIRoute = async (context) => {
  const kv = asListable(getKV());
  if (!kv) return fail(ERRORI.archivio, 503);
  const email = context.locals.admin?.email ?? '';

  const declared = Number(context.request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return fail(ERRORI.troppoGrande, 413);

  let payload: { id?: unknown; doc?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return fail(ERRORI.malformata, 400);
  }

  const requestedId = typeof payload.id === 'string' ? payload.id : '';
  // A client-supplied id is a key into a namespace shared with `login-fail:*`,
  // so it is validated rather than trusted; anything else gets a fresh one.
  const id = DRAFT_ID.test(requestedId) ? requestedId : newDraftId();

  const existing = await getDraft(kv, id);
  if (existing && ownership(existing.owner, email) === 'altrui') {
    return fail(ERRORI.altrui, 403);
  }

  const doc = sanitiseDraft(payload.doc, email);
  if (!doc) return fail(ERRORI.malformata, 400);

  // The slug is frozen at first publish and never recomputed, so an edit to the
  // title of a live article cannot move its URL.
  if (existing?.publishedSlug) doc.publishedSlug = existing.publishedSlug;

  // Refuse a write that changes nothing. Autosave fires on a timer and on
  // pagehide, so "he opened the editor and closed it" would otherwise cost a
  // write every time — and writes are the scarce resource, not reads.
  if (existing && unchanged(existing, doc)) {
    return json({ ok: true, id, salvata: false, aggiornata: existing.updatedAt });
  }

  const metadata: DraftMetadata = {
    title: doc.title.slice(0, 120),
    updatedAt: doc.updatedAt,
    owner: email,
    ...(doc.publishedSlug ? { slug: doc.publishedSlug } : {}),
  };

  try {
    await kv.put(draftKey(id), JSON.stringify(doc), {
      expirationTtl: 60 * 60 * 24 * 90,
      metadata,
    });
  } catch {
    return fail(ERRORI.archivio, 503);
  }

  return json({ ok: true, id, salvata: true, aggiornata: doc.updatedAt });
};

export const DELETE: APIRoute = async (context) => {
  const kv = asListable(getKV());
  if (!kv) return fail(ERRORI.archivio, 503);
  const email = context.locals.admin?.email ?? '';

  const id = context.url.searchParams.get('id') ?? '';
  if (!DRAFT_ID.test(id)) return fail(ERRORI.bozzaIgnota, 400);

  const doc = await getDraft(kv, id);
  if (!doc) return json({ ok: true, id });
  if (ownership(doc.owner, email) === 'altrui') return fail(ERRORI.altrui, 403);

  // Delete the photos too. They expire on their own, but leaving up to 40 × 550 KB
  // of base64 behind for 30 days per discarded draft is the kind of thing that is
  // invisible until a quota page says so.
  const index = await getPhotoIndex(kv, id);
  for (const photoId of index?.ids ?? []) {
    await kv.delete(photoKey(id, photoId)).catch(() => undefined);
  }
  await kv.delete(photoIndexKey(id)).catch(() => undefined);
  await kv.delete(draftKey(id)).catch(() => undefined);

  return json({ ok: true, id });
};

/**
 * Content equality, ignoring `updatedAt` — which changes on every serialise and
 * would otherwise make every draft look modified.
 */
function unchanged(a: DraftDoc, b: DraftDoc): boolean {
  const strip = (d: DraftDoc) => JSON.stringify({ ...d, updatedAt: 0 });
  return strip(a) === strip(b);
}
