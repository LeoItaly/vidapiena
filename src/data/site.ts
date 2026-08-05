/**
 * Site-wide facts — locale-independent. Single source of truth shared by
 * components, copy dictionaries and JSON-LD. Verified against
 * `Context Knowledge/note tours.md` (parent folder, local-only) on 21 Jul 2026.
 *
 * Booking is OTA-platform-only by client decision (21 Jul 2026) — WhatsApp is
 * deliberately absent; Instagram is the one direct-contact channel.
 */

export const SITE = {
  name: 'Vidapiena',
  /**
   * Production origin. Read from the `site` value in astro.config.mjs rather
   * than repeated here, so the custom-domain cutover is a one-place change and
   * the two can never drift apart. The fallback only ever applies if `site` is
   * unset, which the config does not allow.
   */
  origin: import.meta.env.SITE || 'https://vidapiena.workers.dev',
  instagram: 'https://www.instagram.com/vidapiena/',
  instagramHandle: '@vidapiena',
  /**
   * Public OTA *profile* pages — the operator/host landing pages, NOT the
   * per-tour deep links in tours.ts. Fill each in as it is collected: an empty
   * string renders no anchor and drops out of `sameAs` (see PERSON_SAMEAS), so
   * this ships safely empty and enriches the entity graph the moment a URL is
   * pasted. Same discipline as tours.ts `otaLinks`.
   */
  profiles: {
    viator: '',
    getyourguide: '',
    airbnb: '',
    civitatis: '',
  },
  guide: {
    name: 'Francesco',
    yearsInRio: 9,
    languages: ['it', 'en', 'pt'] as const,
  },
} as const;

/**
 * Every profile that corroborates the same Vidapiena/Francesco entity — Instagram
 * plus whichever OTA profile URLs are filled in above. Used as JSON-LD `sameAs`
 * on the Person (About page) and the operator references, so search engines and
 * AI assistants resolve the site, the guide and the OTA listings as one entity.
 */
export const PERSON_SAMEAS: string[] = [
  SITE.instagram,
  ...Object.values(SITE.profiles).filter(Boolean),
];
