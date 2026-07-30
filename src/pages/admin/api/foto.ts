/**
 * Receives one already-processed photo and parks it against the draft.
 *
 * Everything expensive happened on the phone (src/lib/admin/photo-process.ts), so
 * this route only validates and stores — which is what keeps it inside the free
 * plan's 10 ms CPU budget. It deliberately does NOT resize, re-encode or inspect
 * pixels: doing any of that here would blow the budget and take the public site
 * down with it, since the marketing pages share this Worker.
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
  looksLikeJpeg,
  hasMetadata,
} from '../../../lib/admin/photo-store';

/** Italian: this reaches Francesco unchanged. */
const ERRORI = {
  nessunFile: 'Non ho ricevuto nessuna foto. Riprova.',
  troppoGrande: 'Questa foto è troppo pesante. Riprova a sceglierla dal rullino.',
  nonJpeg: 'Questo file non è una foto valida. Scegli una foto dal rullino del telefono.',
  metadati: 'Questa foto contiene ancora dati di posizione. Riprova a caricarla.',
  archivio: 'Non riesco a salvare la foto in questo momento. Riprova fra poco.',
} as const;

const fail = (messaggio: string, status: number) =>
  new Response(JSON.stringify({ ok: false, errore: messaggio }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export const POST: APIRoute = async (context) => {
  const kv = getKV();
  if (!kv) return fail(ERRORI.archivio, 503);

  // Bound the body before touching it. formData() on an unbounded upload is CPU
  // spent before any check can reject it, and this Worker has 10 ms.
  const declared = Number(context.request.headers.get('content-length') ?? '0');
  if (declared > MAX_UPLOAD_BYTES) return fail(ERRORI.troppoGrande, 413);

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
  if (!/^[a-z0-9]{6,32}$/.test(draftId)) return fail(ERRORI.nessunFile, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!looksLikeJpeg(bytes)) return fail(ERRORI.nonJpeg, 415);

  // The browser pipeline cannot emit EXIF, so this firing means something else
  // produced the bytes. Refuse rather than publish a favela's GPS coordinates —
  // this is the one mistake that cannot be undone once the photo is public.
  if (hasMetadata(bytes)) return fail(ERRORI.metadati, 422);

  const alt = String(form.get('alt') ?? '').slice(0, 300);
  const caption = String(form.get('didascalia') ?? '').slice(0, 300);
  const width = Number(form.get('larghezza') ?? 0) | 0;
  const height = Number(form.get('altezza') ?? 0) | 0;

  const id = newPhotoId();

  // btoa needs a binary string; chunked so a 400 KB photo cannot blow the call
  // stack the way String.fromCharCode(...bytes) would on a large array.
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  try {
    await putPhoto(kv, draftId, id, {
      data: btoa(binary),
      width,
      height,
      bytes: bytes.length,
      alt,
      caption,
      uploadedAt: Date.now(),
    });
  } catch {
    return fail(ERRORI.archivio, 503);
  }

  return new Response(JSON.stringify({ ok: true, id, bytes: bytes.length, width, height }), {
    status: 201,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
