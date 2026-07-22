/**
 * Build-time Instagram import — source = Behold (managed IG feed proxy).
 * Mirrors scripts/prepare-photos.mjs: sharp re-encode, EXIF stripped, mozjpeg q80.
 *
 * Runs in CI as a prebuild step (before `astro build`) and locally via
 * `npm run instagram`. It writes the latest posts into the asset pipeline so
 * Astro renders them as first-party AVIF/WebP tiles — no runtime widget, no CWV cost.
 *
 * CONTRACT: this script can NEVER fail a build. Every failure path (missing env,
 * network, non-200, malformed JSON, empty feed, per-image 404, corrupt image)
 * is caught, logged as a warning, and the process exits 0, leaving whatever was
 * already present untouched → src/components/InstagramBand.astro falls back to
 * the curated strip.
 *
 * Outputs (git-ignored, ephemeral, regenerated every build):
 *   src/assets/instagram/ig-1.jpg … ig-N.jpg
 *   src/data/instagram-feed.json   ([{ key, permalink, alt }] in feed order)
 *
 * Source-agnostic: anything that produces those two outputs works. Swapping
 * Behold for Meta's Graph API later touches only this file.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG_DIR = path.join(REPO, 'src', 'assets', 'instagram');
const SIDECAR = path.join(REPO, 'src', 'data', 'instagram-feed.json');

const N = 6; // Behold free-tier ceiling; matches the 6-tile grid
const MAX_W = 800; // stored longest edge — Picture downsamples to 240/480
const TIMEOUT = 15_000;

const log = (m) => console.log(`[instagram] ${m}`);
const warn = (m) => console.warn(`[instagram] WARN ${m}`);

/** Strip URLs, hashtags, mentions and collapse whitespace; cap length for alt text. */
const sanitize = (raw) =>
  !raw
    ? ''
    : String(raw)
        .replace(/https?:\/\/\S+/g, '')
        .replace(/#[\p{L}\p{N}_]+/gu, '')
        .replace(/@[\p{L}\p{N}_.]+/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120)
        .trim();

/** Best still image for a post. VIDEO → thumbnail; else skip. Prefer large (1000px). */
const pickUrl = (p) =>
  p.sizes?.large?.mediaUrl || p.sizes?.medium?.mediaUrl || p.mediaUrl || p.thumbnailUrl || null;

async function get(url, asJson) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return asJson ? res.json() : Buffer.from(await res.arrayBuffer());
}

/** sharp: bake EXIF orientation, resize, mozjpeg — no withMetadata → EXIF/GPS stripped. */
const encode = (buf) =>
  sharp(buf)
    .rotate()
    .resize({ width: MAX_W, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

async function main() {
  const feedId = process.env.BEHOLD_FEED_ID;
  if (!feedId) return warn('BEHOLD_FEED_ID not set — using curated fallback.');

  mkdirSync(IMG_DIR, { recursive: true });

  const data = await get(`https://feeds.behold.so/${feedId}`, true);
  const posts = Array.isArray(data) ? data : (data.posts ?? []); // schema-tolerant
  if (!posts.length) return warn('feed returned 0 posts — using curated fallback.');

  // Buffer-first: download + encode everything in memory before touching the folder,
  // so a partial failure never wipes a previously-good set or half-writes.
  const out = [];
  for (const p of posts) {
    if (out.length >= N) break;
    const url = pickUrl(p);
    if (!url) {
      warn(`post ${p.id ?? '?'}: no usable image URL — skip`);
      continue;
    }
    try {
      out.push({
        buffer: await encode(await get(url, false)),
        permalink: p.permalink ?? '',
        alt: sanitize(p.altText || p.prunedCaption || p.caption),
      });
    } catch (e) {
      warn(`post ${p.id ?? '?'} failed (${e.message}) — skip, continue`);
    }
  }
  if (!out.length) return warn('no images processed — using curated fallback.');

  // Only now touch the folder: clear stale tiles from a prior (larger) run, then write.
  for (const f of readdirSync(IMG_DIR)) {
    if (/^ig-\d+\.jpg$/.test(f)) rmSync(path.join(IMG_DIR, f));
  }
  const sidecar = out.map((r, i) => {
    const key = `ig-${i + 1}`;
    writeFileSync(path.join(IMG_DIR, `${key}.jpg`), r.buffer);
    return { key, permalink: r.permalink, alt: r.alt };
  });
  writeFileSync(SIDECAR, JSON.stringify(sidecar, null, 2) + '\n');
  log(`wrote ${sidecar.length} tiles.`);
}

main()
  .catch((e) => warn(`unexpected (${e?.message ?? e}) — build continues with fallback.`))
  .finally(() => {
    process.exitCode = 0; // never fail the build
  });
