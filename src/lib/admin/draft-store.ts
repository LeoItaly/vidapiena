/**
 * Where an unfinished article lives.
 *
 * ## Why KV is the *backup* here and not the primary store
 *
 * The free plan allows **1,000 KV writes per day**, shared with the login rate
 * limiter and the photo uploads. A conventional per-keystroke or per-few-seconds
 * autosave would spend that in a single afternoon of writing and then start
 * failing — silently, on the one feature whose entire purpose is not losing his
 * work.
 *
 * So the editor autosaves to **localStorage** continuously (free, instant, works
 * with no signal — which matters in a favela) and pushes to KV only on a long
 * interval, when the browser is backgrounded, and when he taps save. localStorage
 * already satisfies the requirement the plan actually states — "survives being
 * backgrounded, killed, or left for two days" — because he is phone-only and
 * single-device. KV is what makes the draft reachable from the publish step and
 * from a second device.
 *
 * ## Ownership
 *
 * Every draft records who created it. There are only two accounts, so this is not
 * about mutual distrust: it is so that a stolen one-year session cannot quietly
 * rewrite the other person's unpublished work, and so the publish step can
 * attribute the git commit to whoever actually wrote the article.
 */

import type { KVLike } from './rate-limit';
import type { Block } from './blocks';

/** 90 days. An article abandoned for a season is abandoned. */
const DRAFT_TTL_SECONDS = 60 * 60 * 24 * 90;

/**
 * Cap on blocks per draft. Not a guess: KV values are limited to 25 MB and a
 * runaway client loop is the realistic way to approach that. It is also what
 * bounds the CPU of every serialise on a 10 ms budget.
 */
export const MAX_BLOCKS = 400;
/** Cap on photos per draft — see `photoIndexKey`. Five is typical; 40 is a mistake. */
export const MAX_PHOTOS = 40;

export interface DraftDoc {
  /** "Titolo" in the UI. Frozen into a slug only at publish. */
  title: string;
  /** "Riassunto". */
  description: string;
  /** ISO `YYYY-MM-DD`; defaults to today in the editor. */
  date: string;
  /** Photo id (not yet a key) of the cover, or '' for none. */
  coverPhotoId: string;
  blocks: Block[];
  /**
   * Set once the article has been published, and then never changed: it is the
   * live URL. Its presence is also what turns "pubblica" into "aggiorna".
   */
  publishedSlug?: string;
  /**
   * The machine-translated English twin, produced in its own publish phase.
   *
   * Parked here rather than recomputed at commit time because translation is the
   * slow step — a dropped connection during it should cost the translation, not
   * the article.
   */
  en?: { title: string; description: string; blocks: Block[] };
  /** The commit this article was published in. */
  lastCommit?: string;
  /**
   * The branch head *before* that commit — the tree a revert restores.
   *
   * Kept on the draft so undoing needs nothing but the draft id, and survives
   * Francesco closing the browser between publishing and regretting it.
   */
  lastParent?: string;
  /** Email of the account that created it. Never shown to the other user. */
  owner: string;
  updatedAt: number;
}

export interface PhotoIndex {
  owner: string;
  /** Photo ids in upload order. The order the picker shows them in. */
  ids: string[];
}

export function draftKey(draftId: string): string {
  return `draft:${draftId}:doc`;
}

export function photoIndexKey(draftId: string): string {
  return `draft:${draftId}:indice`;
}

/**
 * Draft ids are generated server-side and must match this exactly wherever they
 * are accepted from a request. They are a path segment into a KV namespace shared
 * with `login-fail:*`, so a free-form id is a write primitive into another
 * feature's keyspace.
 */
export const DRAFT_ID = /^[a-z0-9]{6,32}$/;

export function newDraftId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function getDraft(kv: KVLike, draftId: string): Promise<DraftDoc | null> {
  const raw = await kv.get(draftKey(draftId));
  if (!raw) return null;
  try {
    const doc = JSON.parse(raw) as DraftDoc;
    return Array.isArray(doc.blocks) ? doc : null;
  } catch {
    return null;
  }
}

export async function putDraft(kv: KVLike, draftId: string, doc: DraftDoc): Promise<void> {
  await kv.put(draftKey(draftId), JSON.stringify(doc), { expirationTtl: DRAFT_TTL_SECONDS });
}

export async function deleteDraft(kv: KVLike, draftId: string): Promise<void> {
  await kv.delete(draftKey(draftId));
}

export async function getPhotoIndex(kv: KVLike, draftId: string): Promise<PhotoIndex | null> {
  const raw = await kv.get(photoIndexKey(draftId));
  if (!raw) return null;
  try {
    const idx = JSON.parse(raw) as PhotoIndex;
    return Array.isArray(idx.ids) ? idx : null;
  } catch {
    return null;
  }
}

export async function putPhotoIndex(
  kv: KVLike,
  draftId: string,
  index: PhotoIndex,
): Promise<void> {
  await kv.put(photoIndexKey(draftId), JSON.stringify(index), {
    expirationTtl: DRAFT_TTL_SECONDS,
  });
}

/**
 * Decides whether `email` may touch `draftId`.
 *
 * Returns `'nuovo'` when the draft has no owner yet — the first write claims it.
 * That is the only way a draft can be created, so there is no separate "create"
 * endpoint to guard.
 */
export function ownership(
  ownerOfRecord: string | null | undefined,
  email: string,
): 'nuovo' | 'proprietario' | 'altrui' {
  if (!ownerOfRecord) return 'nuovo';
  return ownerOfRecord.toLowerCase() === email.toLowerCase() ? 'proprietario' : 'altrui';
}

/**
 * Trims a client-supplied draft to something that cannot hurt us.
 *
 * The editor is the only intended caller, but it runs on a phone the client
 * controls, so every bound is enforced here as well. Silently clamping rather
 * than rejecting is deliberate: a rejected autosave is lost writing, and the
 * limits are far above anything a real article reaches.
 */
export function sanitiseDraft(input: unknown, owner: string): DraftDoc | null {
  if (typeof input !== 'object' || input === null) return null;
  const d = input as Record<string, unknown>;

  const text = (v: unknown, max: number): string =>
    typeof v === 'string' ? v.slice(0, max) : '';

  const rawBlocks = Array.isArray(d.blocks) ? d.blocks.slice(0, MAX_BLOCKS) : [];
  const blocks: Block[] = [];
  for (const b of rawBlocks) {
    if (typeof b !== 'object' || b === null) continue;
    const k = (b as Record<string, unknown>).k;
    const r = b as Record<string, unknown>;
    switch (k) {
      case 'p':
      case 'h2':
      case 'h3':
      case 'quote':
        blocks.push({ k, testo: text(r.testo, 20000) } as Block);
        break;
      case 'ul':
      case 'ol':
        blocks.push({
          k,
          voci: (Array.isArray(r.voci) ? r.voci : []).slice(0, 100).map((v) => text(v, 2000)),
        } as Block);
        break;
      case 'foto':
        blocks.push({
          k: 'foto',
          fotoId: text(r.fotoId, 32),
          alt: text(r.alt, 300),
          ...(text(r.didascalia, 300) ? { didascalia: text(r.didascalia, 300) } : {}),
        });
        break;
      default:
        // An unknown block kind is dropped rather than stored: anything that
        // reaches blocksToMarkdown must be something it can serialise, or the
        // article silently loses a section at publish instead of here.
        break;
    }
  }

  const date = text(d.date, 10);

  return {
    title: text(d.title, 300),
    description: text(d.description, 600),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
    coverPhotoId: text(d.coverPhotoId, 32),
    blocks,
    ...(text(d.publishedSlug, 120) ? { publishedSlug: text(d.publishedSlug, 120) } : {}),
    owner,
    updatedAt: Date.now(),
  };
}
