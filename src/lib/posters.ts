import { getImage } from 'astro:assets';
import poster16 from '../assets/posters/hero-poster-16x9.jpg';
import poster9 from '../assets/posters/hero-poster-9x16.jpg';

/**
 * Single source for the hero-poster transforms so BaseHead's preloads and
 * Hero's <picture> emit byte-identical URLs (one download per viewport).
 * The media split ("3/4 aspect") must stay in sync between the two.
 */
export const POSTER_MEDIA = {
  portrait: '(max-aspect-ratio: 3/4)',
  landscape: '(min-aspect-ratio: 3/4)',
};

export async function getHeroPosters() {
  // AVIF: ~40% smaller than webp for this texture-heavy artwork — the poster is
  // the LCP element, its bytes are the LCP on 4G. All evergreen browsers decode AVIF.
  const landscape = await getImage({ src: poster16, format: 'avif', width: 1440, quality: 52 });
  const portrait = await getImage({ src: poster9, format: 'avif', width: 640, quality: 50 });
  return { landscape, portrait };
}
