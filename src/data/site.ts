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
  guide: {
    name: 'Francesco',
    yearsInRio: 9,
    languages: ['it', 'en', 'pt'] as const,
  },
} as const;
