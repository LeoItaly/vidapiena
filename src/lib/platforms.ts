import type { Tour } from '../data/tours';

/**
 * The four OTA platforms, one place — booking buttons, badge rows and the
 * contact page all read the same list. Trademark rules
 * (visual-references/platform-logos/README.md): official variants only, no
 * recoloring, light neutral background. Per-tour deep links live in
 * tours.ts `otaLinks`; global rows stay unlinked (OTA-LINKS.md rule).
 * The marks themselves render through components/OtaLogo.astro, which owns
 * the logo assets (three inlined SVGs + the Viator PNG).
 */
export type PlatformKey = keyof Tour['otaLinks'];

export interface Platform {
  key: PlatformKey;
  name: string;
}

export const PLATFORMS: Platform[] = [
  { key: 'viator', name: 'Viator' },
  { key: 'getyourguide', name: 'GetYourGuide' },
  { key: 'airbnb', name: 'Airbnb' },
  { key: 'civitatis', name: 'Civitatis' },
];
