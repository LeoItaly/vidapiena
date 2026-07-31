/**
 * Receives one already-processed photo and parks it against the draft.
 *
 * Everything expensive happened on the phone (src/lib/admin/photo-process.ts), so
 * this route only validates and stores — which is what keeps it inside the free
 * plan's 10 ms CPU budget. It deliberately does NOT resize, re-encode or inspect
 * pixels: doing any of that here would blow the budget and take the public site
 * down with it, since the marketing pages share this Worker.
 *
 * ⚠️ The one thing that *did* blow the budget was the base64 encoding, which is
 * not obviously expensive at all: `String.fromCharCode(...)` + `btoa` measured
 * **30 ms** in workerd for a 400 KB photo — three times the entire per-request
 * allowance — and passed every local test because `wrangler dev` does not enforce
 * the limit. `bytesToBase64` now uses the runtime's native codec at ~1 ms. See
 * photo-store.ts.
 *
 * Authentication is not checked here. src/middleware.ts guards everything under
 * /admin, and for /admin/api/* it answers 401 JSON rather than redirecting — a
 * 302 to an HTML login page is followed transparently by fetch(), so the editor
 * would read a failed upload as a success.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getKV } from '../../../lib/admin/runtime';
import {
  MAX_UPLOAD_BYTES,
  newPhotoId,
  putPhoto,
  getPhoto,
  deletePhoto,
  looksLikeJpeg,
  readJpegHeader,
  bytesToBase64,
  base64ToBytes,
} from '../../../lib/admin/photo-store';
import {
  DRAFT_ID,
  MAX_PHOTOS,
  getDraft,
  getPhotoIndex,
  putPhotoIndex,
  ownership,
} from '../../../lib/admin/draft-store';

/** Italian: this reaches Francesco unchanged. */
const ERRORI = {
  nessunFile: 'Non ho ricevuto nessuna foto. Riprova.',
  troppoGrande: 'Questa foto è troppo pesante. Riprova a sceglierla dal rullino.',
  nonJpeg: 'Questo file non è una foto valida. Scegli una foto dal rullino del telefono.',
  metadati: 'Questa foto contiene ancora dati di posizione. Riprova a caricarla.',
  troppoPiccola:
    'Questa foto è troppo piccola per il sito: verrebbe sgranata. Scegline una scattata con la fotocamera.',
  troppeFoto: `Hai già ${MAX_PHOTOS} foto in questo articolo. Cancellane qualcuna prima di aggiungerne altre.`,
  archivio: 'Non riesco a salvare la foto in questo momento. Riprova fra poco.',
  altrui: 'Questa bozza è di un altro account.',
} as const;

/**
 * Smallest long edge worth publishing.
 *
 * The cover renders full-width at `aspect-[16/9]` and the index thumb at 4/3, so
 * a small source is visibly soft on the one image that sells the article. This
 * exists because the pipeline had no floor at all: a 60×40 JPEG processed cleanly,
 * uploaded 201 and reported "Pronta". That is not hypothetical — images arriving
 * over WhatsApp are routinely a few hundred pixels, and WhatsApp is how this
 * client receives most things.
 */
const MIN_EDGE = 900;

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const fail = (messaggio: string, status: number) => json({ ok: false, errore: messaggio }, status);

/**
 * Trims alt text and captions to something that survives being written into a
 * markdown file.
 *
 * `String(x).slice(0, 300)` cuts by UTF-16 code unit, so a caption whose 300th
 * unit lands inside an emoji stores a lone surrogate. It round-trips through KV
 * intact and then becomes U+FFFD the moment stage 5 encodes the file as UTF-8 —
 * Francesco sees a black diamond in his published caption and has no way to
 * understand it. `Array.from` iterates code points, so a character is never
 * split. Newlines go too: both fields end up on a single line of markdown.
 */
function testoBreve(value: FormDataEntryValue | null): string {
  const flat = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const points = Array.from(flat);
  return points.length <= 300 ? flat : points.slice(0, 300).join('');
}

export const POST: APIRoute = async (context) => {
  const kv = getKV();
  if (!kv) return fail(ERRORI.archivio, 503);
  const email = context.locals.admin?.email ?? '';

  /*
   * Bound the body before touching it. formData() on an unbounded upload is CPU
   * spent before any check can reject it, and this Worker has 10 ms.
   *
   * A *declared* length must be present and sane — not merely "not too large".
   * The previous check was `declared > MAX` against `Number(header ?? '0')`, so
   * omitting the header entirely (or sending `Transfer-Encoding: chunked`, or a
   * non-numeric value) produced `0`, sailed through, and handed formData() an
   * unbounded body: precisely what the check existed to prevent.
   *
   * Requiring the header is safe for every real caller. A browser sending a
   * FormData body computes and sets Content-Length itself — it does not stream
   * it — which is why the 1.5 MB probe got a clean 413 rather than hanging.
   */
  const raw = context.request.headers.get('content-length');
  const declared = raw === null ? NaN : Number(raw);
  if (!Number.isFinite(declared) || declared <= 0 || declared > MAX_UPLOAD_BYTES) {
    return fail(ERRORI.troppoGrande, 413);
  }

  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return fail(ERRORI.nessunFile, 400);
  }

  const file = form.get('foto');
  const draftId = String(form.get('bozza') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) return fail(ERRORI.nessunFile, 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail(ERRORI.troppoGrande, 413);

  // The draft id namespaces KV keys, so it must not be free-form: a caller could
  // otherwise write outside its own prefix, or collide with the rate limiter's
  // `login-fail:` keys.
  if (!DRAFT_ID.test(draftId)) return fail(ERRORI.nessunFile, 400);

  // Bind the photo to a draft its author owns. Without this any well-formed id
  // was accepted — verified: posting `bozza=aaaaaaaaaaaa` returned 201 into a
  // draft belonging to nobody.
  const draft = await getDraft(kv, draftId);
  const index = (await getPhotoIndex(kv, draftId)) ?? { owner: email, ids: [] };
  const owner = draft?.owner ?? index.owner;
  if (ownership(owner, email) === 'altrui') return fail(ERRORI.altrui, 403);
  if (index.ids.length >= MAX_PHOTOS) return fail(ERRORI.troppeFoto, 409);

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!looksLikeJpeg(bytes)) return fail(ERRORI.nonJpeg, 415);

  // One header walk answers both questions, at ~0.01 ms.
  const header = readJpegHeader(bytes);

  // The browser pipeline cannot emit EXIF, so this firing means something else
  // produced the bytes. Refuse rather than publish a favela's GPS coordinates —
  // this is the one mistake that cannot be undone once the photo is public.
  if (header.hasMetadata) return fail(ERRORI.metadati, 422);

  if (!header.width || !header.height) return fail(ERRORI.nonJpeg, 415);
  if (Math.max(header.width, header.height) < MIN_EDGE) return fail(ERRORI.troppoPiccola, 422);

  const alt = testoBreve(form.get('alt'));
  const caption = testoBreve(form.get('didascalia'));

  const id = newPhotoId();

  try {
    await putPhoto(kv, draftId, id, {
      data: bytesToBase64(bytes),
      // From the file itself, never from the form: the client-supplied fields
      // were observed to accept -99999 and 1e9, and they feed the crop preview.
      width: header.width,
      height: header.height,
      bytes: bytes.length,
      alt,
      caption,
      uploadedAt: Date.now(),
    });
    await putPhotoIndex(kv, draftId, { owner, ids: [...index.ids, id] });
  } catch {
    return fail(ERRORI.archivio, 503);
  }

  return json(
    { ok: true, id, bytes: bytes.length, width: header.width, height: header.height },
    201,
  );
};

/**
 * Serves a pending photo, so the picker and the preview can show the real image
 * before it is anywhere near the repo.
 *
 * `base64ToBytes` uses the native codec for the same CPU reason as the upload.
 * Cached hard but **privately**: the bytes never change under an id, and a phone
 * on Rio mobile data should not re-download 400 KB to redraw a thumbnail — but
 * this is content behind a login, so no shared cache may hold it.
 */
export const GET: APIRoute = async (context) => {
  const kv = getKV();
  if (!kv) return fail(ERRORI.archivio, 503);
  const email = context.locals.admin?.email ?? '';

  const draftId = context.url.searchParams.get('bozza') ?? '';
  const photoId = context.url.searchParams.get('foto') ?? '';
  if (!DRAFT_ID.test(draftId) || !/^[a-z0-9]{6,32}$/.test(photoId)) {
    return fail(ERRORI.nessunFile, 400);
  }

  const index = await getPhotoIndex(kv, draftId);
  if (index && ownership(index.owner, email) === 'altrui') return fail(ERRORI.altrui, 403);

  const photo = await getPhoto(kv, draftId, photoId);
  if (!photo) return fail(ERRORI.nessunFile, 404);

  const bytes = base64ToBytes(photo.data);
  // A detached ArrayBuffer rather than the view: `BodyInit` here comes from the
  // Workers types, which do not accept a Uint8Array even though the runtime does.
  const body = (bytes.buffer as ArrayBuffer).slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );

  return new Response(body, {
    headers: {
      'content-type': 'image/jpeg',
      'content-length': String(bytes.byteLength),
      'cache-control': 'private, max-age=86400, immutable',
    },
  });
};

/**
 * Updates the alt text and caption of a stored photo.
 *
 * Separate from the upload because alt text is written *after* seeing the photo,
 * and because a re-upload to change a caption would spend another KV write on a
 * 1,000-a-day budget — and re-send 400 KB over Rio mobile data.
 */
export const PATCH: APIRoute = async (context) => {
  const kv = getKV();
  if (!kv) return fail(ERRORI.archivio, 503);
  const email = context.locals.admin?.email ?? '';

  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return fail(ERRORI.nessunFile, 400);
  }

  const draftId = String(form.get('bozza') ?? '').trim();
  const photoId = String(form.get('foto') ?? '').trim();
  if (!DRAFT_ID.test(draftId) || !/^[a-z0-9]{6,32}$/.test(photoId)) {
    return fail(ERRORI.nessunFile, 400);
  }

  const index = await getPhotoIndex(kv, draftId);
  if (index && ownership(index.owner, email) === 'altrui') return fail(ERRORI.altrui, 403);

  const photo = await getPhoto(kv, draftId, photoId);
  if (!photo) return fail(ERRORI.nessunFile, 404);

  const alt = form.has('alt') ? testoBreve(form.get('alt')) : photo.alt;
  const caption = form.has('didascalia') ? testoBreve(form.get('didascalia')) : photo.caption;

  // Nothing changed → no write. Alt fields fire on blur, and blurring an
  // untouched field is the common case.
  if (alt === photo.alt && caption === photo.caption) {
    return json({ ok: true, id: photoId, salvata: false }, 200);
  }

  try {
    await putPhoto(kv, draftId, photoId, { ...photo, alt, caption });
  } catch {
    return fail(ERRORI.archivio, 503);
  }

  return json({ ok: true, id: photoId, salvata: true }, 200);
};

/** Removes one photo from a draft, and from the index that orders the picker. */
export const DELETE: APIRoute = async (context) => {
  const kv = getKV();
  if (!kv) return fail(ERRORI.archivio, 503);
  const email = context.locals.admin?.email ?? '';

  const draftId = context.url.searchParams.get('bozza') ?? '';
  const photoId = context.url.searchParams.get('foto') ?? '';
  if (!DRAFT_ID.test(draftId) || !/^[a-z0-9]{6,32}$/.test(photoId)) {
    return fail(ERRORI.nessunFile, 400);
  }

  const index = await getPhotoIndex(kv, draftId);
  if (index && ownership(index.owner, email) === 'altrui') return fail(ERRORI.altrui, 403);

  await deletePhoto(kv, draftId, photoId);
  if (index) {
    await putPhotoIndex(kv, draftId, {
      owner: index.owner,
      ids: index.ids.filter((x) => x !== photoId),
    });
  }

  return json({ ok: true, id: photoId }, 200);
};
