/**
 * Where a photo lives between "Francesco picked it" and "it is in a git commit".
 *
 * Photos are held in KV against the draft, not written to the repo, because a
 * publish must be ONE commit (plan, Part 5.4) — the article, its English twin and
 * every photo landing together so exactly one 6–7 minute build runs. Anything
 * committed at upload time would trigger a build per photo.
 *
 * Budget note: the free plan allows 1,000 KV writes/day, shared with the login
 * rate limiter. One upload is one write, so ~5 photos per article is nothing —
 * but this is the same pool stage 4's autosave draws on, which is why autosave
 * has to stay debounced rather than per-keystroke.
 */

import type { KVLike } from './rate-limit';

/** 30 days. Long enough to survive "I'll finish it after the tour", twice over. */
const PENDING_TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * Hard ceiling on what the upload route will accept.
 *
 * Must stay ABOVE `MAX_BYTES` in photo-process.ts (900 KB), which is what the
 * phone pipeline can legitimately emit when a dense favela scene cannot reach the
 * 400 KB target without dropping under 1280 px. Measured worst case across the
 * real archive is 498 KB, but the two numbers have to be ordered correctly or a
 * perfectly good photo is refused as "troppo pesante" — an error the client
 * cannot act on, about a file he did nothing wrong with.
 *
 * Still small enough that reading the body costs nothing against the 10 ms budget.
 */
export const MAX_UPLOAD_BYTES = 1024 * 1024;

/**
 * KV values are strings here, so the JPEG travels as base64 — ~33% overhead,
 * which on a ≤400 KB photo is ~533 KB, comfortably inside KV's 25 MB value limit.
 */
export interface PendingPhoto {
  /** base64, no data: prefix. */
  data: string;
  width: number;
  height: number;
  bytes: number;
  /** Author-supplied, mandatory before publish — see the editor. */
  alt: string;
  /** Optional visible caption under the image (Leo's 30/07 decision). */
  caption: string;
  uploadedAt: number;
}

/**
 * Keyed by draft, not by article slug.
 *
 * The final photo key is `blog-<slug>-NN`, but the slug comes from a title he can
 * still be editing, so binding a stored photo to it now would mean renaming
 * blobs — and rewriting the body that references them — every time he touches the
 * headline. Photos therefore carry an opaque id until publish, and the block
 * model stores that id. The `blog-<slug>-NN` names are assigned once, at publish,
 * when the slug is finally frozen.
 */
export function photoKey(draftId: string, photoId: string): string {
  return `draft:${draftId}:foto:${photoId}`;
}

// The per-draft photo index lives in draft-store.ts (`photoIndexKey`), next to
// the ownership record it shares a key with. Two spellings of the same index —
// `:foto-index` here and `:indice` there — would each hold half the truth.

export async function putPhoto(
  kv: KVLike,
  draftId: string,
  photoId: string,
  photo: PendingPhoto,
): Promise<void> {
  await kv.put(photoKey(draftId, photoId), JSON.stringify(photo), {
    expirationTtl: PENDING_TTL_SECONDS,
  });
}

export async function getPhoto(
  kv: KVLike,
  draftId: string,
  photoId: string,
): Promise<PendingPhoto | null> {
  const raw = await kv.get(photoKey(draftId, photoId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPhoto;
  } catch {
    return null;
  }
}

export async function deletePhoto(kv: KVLike, draftId: string, photoId: string): Promise<void> {
  await kv.delete(photoKey(draftId, photoId));
}

/**
 * Ids are generated server-side, never taken from the request.
 *
 * A client-supplied id is a path into the shared KV namespace, so accepting one
 * would let a caller overwrite another draft's photo — or, once the publish loop
 * exists, the value a commit is built from.
 */
export function newPhotoId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

/** JPEG SOI + APP marker. Checked because the extension proves nothing. */
export function looksLikeJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/**
 * Walks the JPEG header segments once, answering both questions we have about a
 * photo: does it still carry identifying metadata, and how big is it really?
 *
 * Measured at **0.01 ms** on a 400 KB photo, because it reads only the segment
 * headers and stops at the first scan — O(a few hundred bytes), not O(file).
 * That matters: this runs inside the free plan's 10 ms per-request CPU budget,
 * shared with the public marketing site.
 *
 * Reading the dimensions here rather than trusting the client is not paranoia
 * about the client — it is that the form fields are the only source otherwise,
 * and they were observed to accept `larghezza=-99999`, `altezza=1e9` and to
 * default to `0×0` when simply omitted. Those numbers go on to drive the cover
 * crop preview and the published `<img>`.
 */
export interface JpegHeader {
  /** APP1 (EXIF/XMP) or APP13 (IPTC) present — i.e. possibly GPS or a name. */
  hasMetadata: boolean;
  width: number;
  height: number;
}

/** SOF markers. C4 (Huffman), C8 (reserved) and CC (arithmetic) are not frames. */
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

export function readJpegHeader(bytes: Uint8Array): JpegHeader {
  const out: JpegHeader = { hasMetadata: false, width: 0, height: 0 };
  let i = 2; // skip SOI

  while (i + 4 < bytes.length) {
    // Segments may be padded with any number of 0xFF fill bytes before the
    // marker. Skipping them rather than bailing out is the difference between
    // reading a legal file and silently reporting "no metadata, 0×0" for it.
    while (i < bytes.length && bytes[i] === 0xff && bytes[i + 1] === 0xff) i += 1;
    if (bytes[i] !== 0xff) break;

    const marker = bytes[i + 1]!;
    // Standalone markers carry no length payload.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    if (marker === 0xe1 || marker === 0xed) out.hasMetadata = true;
    // Start of scan — the compressed data begins, nothing further to read.
    if (marker === 0xda || marker === 0xd9) break;

    const len = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    if (len < 2 || i + 2 + len > bytes.length) break;

    if (isStartOfFrame(marker) && i + 9 <= bytes.length) {
      out.height = (bytes[i + 5]! << 8) | bytes[i + 6]!;
      out.width = (bytes[i + 7]! << 8) | bytes[i + 8]!;
      // Both answers are now known; EXIF always precedes the frame.
      if (out.hasMetadata) break;
    }

    i += 2 + len;
  }

  return out;
}

/**
 * Base64 for KV, using the runtime's native codec.
 *
 * ⚠️ The obvious implementation — `String.fromCharCode(...chunk)` in a loop, then
 * `btoa` — costs **30 ms** in workerd for a 400 KB photo. The free plan allows
 * **10 ms of CPU per request**, so that version failed *every* upload in
 * production with error 1102 while passing perfectly under `wrangler dev`, which
 * does not enforce the limit. This is the identical trap that PBKDF2 at 100,000
 * iterations fell into on the login (docs/HOSTING.md).
 *
 * `Uint8Array.prototype.toBase64` costs **1 ms** and was verified in workerd
 * itself — available, and byte-identical to the `btoa` output.
 */
interface Base64Codec {
  toBase64?: () => string;
}
interface Base64Static {
  fromBase64?: (s: string) => Uint8Array;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const native = (bytes as unknown as Base64Codec).toBase64;
  if (typeof native === 'function') return native.call(bytes);

  // Fallback for a runtime without the native codec. Kept because a silent
  // TypeError here would lose a photo, but it is the slow path and must not be
  // the one that runs — see the CPU note above.
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(data: string): Uint8Array {
  const native = (Uint8Array as unknown as Base64Static).fromBase64;
  if (typeof native === 'function') return native(data);

  const binary = atob(data);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}
