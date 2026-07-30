/**
 * Turns a photo straight off Francesco's phone into something the site can ship.
 *
 * ⚠️ This runs in the BROWSER, not in the Worker, and that is not a style choice.
 * The Workers free plan allows 10 ms of active CPU per request; decoding a 24 MP
 * iPhone photo and re-encoding it is orders of magnitude past that, and the
 * alternative — Cloudflare Images — is a billable service, which is the very
 * thing `imageService: 'compile'` exists to keep us away from. Doing it on the
 * phone costs nothing, keeps the Worker at near-zero CPU, and means a 12 MB file
 * never crosses the network in the first place.
 *
 * What comes in: 3–12 MB, usually vertical, usually HEIC, EXIF intact including
 * GPS coordinates of a favela.
 * What goes out: a lowercase `.jpg`, at least 1280 px on its long edge, aiming at
 * 400 KB, correctly rotated, with **no metadata at all** — a canvas re-encode
 * structurally cannot carry EXIF forward, so the privacy rule is enforced by the
 * pipeline rather than trusted to a step someone might skip.
 *
 * Mirrors scripts/prepare-photos.mjs (sharp: rotate → resize → q80) as closely as
 * a browser can. Two real differences: browsers do not expose mozjpeg, so quality
 * is searched rather than fixed at q80; and 400 KB is a target rather than a cap
 * (see TARGET_BYTES).
 *
 * Measured across 10 photos from the real archive: 4 reach the target at
 * 1280–1600 px, 6 land at 1280 px / q0.64 between 426 and 498 KB, none drops
 * below 1280 px, and none retains EXIF.
 */

/** House range — matches the 1600 px used for the denser tour photos. */
const MAX_EDGE = 1600;

/**
 * Byte target, not a hard limit — and the distinction is deliberate.
 *
 * Measured on the real archive: a dense favela scene at 1600 px is 1054 KB at
 * q80 and still 642 KB at q55, so 400 KB is simply unreachable at that size. A
 * strict 400 KB cap therefore does not buy a smaller photo, it buys a *smaller
 * picture*: the search falls through to 1024 px, which is visibly soft as an
 * article cover (rendered full-width at aspect-[16/9]).
 *
 * What 400 KB actually protects is repo size and build time — NOT page weight.
 * Visitors never receive this file: Astro generates AVIF/WebP derivatives from it
 * at build time. docs/UPDATES.md already recorded the same conclusion for the 46
 * curated photos ("some dense favela scenes still exceed the 400 KB advisory —
 * source-only weight, browsers get AVIF/WebP").
 *
 * So: aim for 400 KB, never go below MIN_EDGE to get there, and refuse anything
 * past MAX_BYTES so a pathological file still cannot bloat the repo.
 */
export const TARGET_BYTES = 400 * 1024;
/** Below this the article cover goes soft; resolution is worth more than bytes. */
const MIN_EDGE = 1280;
/**
 * Absolute refusal point. MUST stay below `MAX_UPLOAD_BYTES` in photo-store.ts
 * (1 MB) — if the pipeline can emit something the route rejects, a perfectly
 * good photo fails with "troppo pesante" and the client has no way to act on it.
 */
export const MAX_BYTES = 900 * 1024;

const QUALITY_START = 0.82;
const QUALITY_FLOOR = 0.62;
const QUALITY_STEP = 0.06;

export interface ProcessedPhoto {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  /** What actually happened, for the Italian UI to report honestly. */
  quality: number;
  downscaled: boolean;
}

export class PhotoError extends Error {
  constructor(
    /** Italian, shown to Francesco verbatim. */
    readonly italiano: string,
    cause?: string,
  ) {
    super(cause ?? italiano);
  }
}

/**
 * Decodes anything the phone hands us, including HEIC.
 *
 * HEIC has no browser-level decoder; it works because iOS lends Safari the
 * system codec, so `createImageBitmap` succeeds on an iPhone and fails on a
 * desktop Chrome. That asymmetry is fine — the client is phone-only — but it has
 * to fail with a sentence he can act on rather than a stack trace.
 *
 * `imageOrientation: 'from-image'` is what applies the EXIF rotation *before* the
 * pixels are copied, which is the browser equivalent of sharp's `.rotate()`. It
 * matters more than it looks: the source photos here carry orientation 5 and 6,
 * so skipping it ships sideways images.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older Safari rejects the options bag. An <img> is the fallback because
    // browsers have defaulted to `image-orientation: from-image` for years, so
    // rotation is still applied — just without a way to ask for it explicitly.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'sync';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(
            new PhotoError(
              'Non riesco ad aprire questa foto. Se l’hai scaricata da un’altra app, ' +
                'riprova scegliendola dal rullino del telefono.',
              'decode failed',
            ),
          );
        img.src = url;
      });
      await img.decode().catch(() => undefined);
      return img;
    } finally {
      // Revoking immediately is safe: the bitmap is already decoded into the
      // element, and not revoking leaks the whole 12 MB per upload.
      URL.revokeObjectURL(url);
    }
  }
}

function targetSize(w: number, h: number, maxEdge: number) {
  const longest = Math.max(w, h);
  if (longest <= maxEdge) return { w, h };
  const scale = maxEdge / longest;
  // Round, then clamp to >= 1: a panorama can otherwise round a short edge to 0
  // and produce a canvas the browser refuses to encode.
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new PhotoError('Non riesco a preparare questa foto. Riprova.', 'toBlob null')),
      'image/jpeg',
      quality,
    );
  });
}

/**
 * The whole pipeline. Never mutates or uploads — returns the bytes to send.
 *
 * The size search is deliberately quality-first and only then dimension-first:
 * dropping quality is invisible on a phone screen, dropping resolution is not,
 * and these photos are the product.
 */
export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  if (!file.size) {
    throw new PhotoError('Questo file è vuoto. Prova a sceglierne un altro.', 'empty file');
  }

  const source = await decode(file);
  const srcW = 'width' in source ? source.width : 0;
  const srcH = 'height' in source ? source.height : 0;

  if (!srcW || !srcH) {
    throw new PhotoError('Questa foto sembra danneggiata. Prova a sceglierne un’altra.', 'zero dims');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new PhotoError('Il telefono non riesce a elaborare la foto. Riprova.', 'no 2d context');
  }

  let maxEdge = MAX_EDGE;
  let downscaled = false;
  /** Best result so far, kept in case nothing reaches the target. */
  let fallback: ProcessedPhoto | null = null;

  // Quality first, then resolution — in that order because JPEG artifacts on a
  // textured favela wall are more objectionable than a slightly smaller image.
  // The loop stops descending at MIN_EDGE: past that the cover goes soft, and
  // overshooting the byte target costs only repo space.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { w, h } = targetSize(srcW, srcH, maxEdge);
    canvas.width = w;
    canvas.height = h;
    // Re-fill on every attempt: a resized canvas is transparent, and JPEG has no
    // alpha, so an unfilled canvas encodes transparent pixels as black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);

    for (let q = QUALITY_START; q >= QUALITY_FLOOR - 1e-9; q -= QUALITY_STEP) {
      const blob = await toBlob(canvas, Number(q.toFixed(2)));
      const result: ProcessedPhoto = {
        blob,
        width: w,
        height: h,
        bytes: blob.size,
        quality: Number(q.toFixed(2)),
        downscaled,
      };

      if (blob.size <= TARGET_BYTES) {
        if ('close' in source) source.close();
        return result;
      }
      // Remember the smallest acceptable-quality candidate, so a photo that can
      // never reach the target still ships at the best size we managed rather
      // than failing outright.
      if (blob.size <= MAX_BYTES && (!fallback || blob.size < fallback.bytes)) {
        fallback = result;
      }
    }

    // Stop shrinking once the cover would go soft. Overshooting 400 KB costs
    // repo space; going under 1280 px costs the client a blurry article header.
    const next = Math.round(maxEdge * 0.8);
    if (next < MIN_EDGE) break;
    maxEdge = next;
    downscaled = true;
  }

  if ('close' in source) source.close();

  if (fallback) return fallback;

  throw new PhotoError(
    'Questa foto è troppo pesante anche dopo la compressione. Provane un’altra.',
    'could not reach size budget',
  );
}
