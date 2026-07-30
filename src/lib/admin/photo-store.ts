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

export function photoIndexKey(draftId: string): string {
  return `draft:${draftId}:foto-index`;
}

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
 * True if the JPEG carries any EXIF/XMP block.
 *
 * The browser pipeline strips metadata by construction — a canvas re-encode
 * cannot preserve it — so this is a belt-and-braces check on the one privacy
 * promise that cannot be walked back once a photo is public: DESIGN.md's rule and
 * the GPS coordinates of a favela embedded in a holiday snap.
 *
 * Scans only the header segments, so it is O(few hundred bytes), not O(file).
 */
export function hasMetadata(bytes: Uint8Array): boolean {
  let i = 2; // skip SOI
  while (i + 4 < bytes.length) {
    if (bytes[i] !== 0xff) return false;
    const marker = bytes[i + 1]!;
    // APP1 (EXIF/XMP) and APP13 (IPTC) are the ones that carry identity or place.
    if (marker === 0xe1 || marker === 0xed) return true;
    // Start of scan: past the headers, nothing left to find.
    if (marker === 0xda) return false;
    const len = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    if (len < 2) return false;
    i += 2 + len;
  }
  return false;
}
