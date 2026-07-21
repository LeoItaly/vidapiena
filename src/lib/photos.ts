import type { ImageMetadata } from 'astro';

/**
 * Curated photos land in src/assets/photos/ via `npm run photos` (M1 manifest).
 * Components resolve by key and must tolerate a missing photo (gradient fallback)
 * so the build never blocks on the curation step.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg', {
  eager: true,
});

export function getPhoto(key: string): ImageMetadata | null {
  for (const [path, mod] of Object.entries(modules)) {
    if (path.endsWith(`/${key}.jpg`)) return mod.default;
  }
  return null;
}
