import viatorLogo from '../assets/logos/viator.png';
import airbnbLogo from '../assets/logos/airbnb.svg';
import gygLogo from '../assets/logos/getyourguide.svg';
import civitatisLogo from '../assets/logos/civitatis.svg';
import type { Tour } from '../data/tours';
import type { ImageMetadata } from 'astro';

/**
 * The four OTA platforms, one place — booking buttons, badge rows and the
 * contact page all read the same list. Trademark rules
 * (visual-references/platform-logos/README.md): official variants only, no
 * recoloring, light neutral background. Per-tour deep links live in
 * tours.ts `otaLinks`; global rows stay unlinked (OTA-LINKS.md rule).
 */
export type PlatformKey = keyof Tour['otaLinks'];

export interface Platform {
  key: PlatformKey;
  name: string;
  logo: ImageMetadata;
}

export const PLATFORMS: Platform[] = [
  { key: 'viator', name: 'Viator', logo: viatorLogo },
  { key: 'getyourguide', name: 'GetYourGuide', logo: gygLogo },
  { key: 'airbnb', name: 'Airbnb', logo: airbnbLogo },
  { key: 'civitatis', name: 'Civitatis', logo: civitatisLogo },
];
