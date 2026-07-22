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
  /** Production origin + base — must match astro.config.mjs */
  origin: 'https://leoitaly.github.io',
  instagram: 'https://www.instagram.com/vidapiena/',
  instagramHandle: '@vidapiena',
  guide: {
    name: 'Francesco',
    yearsInRio: 9,
    languages: ['it', 'en', 'pt'] as const,
  },
} as const;
