import type { ImageMetadata } from 'astro';

/**
 * Build-time Instagram feed for InstagramBand.astro. Mirrors lib/photos.ts.
 *
 * `ig-*.jpg` + the sidecar are written by scripts/fetch-instagram.mjs at prebuild
 * and are git-ignored. If the fetch never ran or the feed was down, both globs
 * resolve to {} and getInstagramTiles() returns [] → the component falls back to
 * the curated strip. Source-agnostic: any producer of these two outputs works
 * (Behold today, Meta Graph API later — only the fetch script changes).
 */
interface FeedEntry {
  key: string;
  permalink: string;
  alt: string;
}

export interface InstagramTile {
  image: ImageMetadata;
  alt: string;
  permalink: string;
}

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/instagram/*.jpg', {
  eager: true,
});
const sidecars = import.meta.glob<{ default: FeedEntry[] }>('../data/instagram-*.json', {
  eager: true,
});

function imageFor(key: string): ImageMetadata | null {
  for (const [path, mod] of Object.entries(images)) {
    if (path.endsWith(`/${key}.jpg`)) return mod.default;
  }
  return null;
}

export function getInstagramTiles(): InstagramTile[] {
  const feed = Object.values(sidecars)[0]?.default ?? [];
  const tiles: InstagramTile[] = [];
  for (const entry of feed) {
    const image = imageFor(entry.key);
    if (image) tiles.push({ image, alt: entry.alt ?? '', permalink: entry.permalink ?? '' });
  }
  return tiles; // ordered by the sidecar (authoritative feed order)
}
