/**
 * Site-wide facts — locale-independent. Single source of truth shared by
 * components, copy dictionaries and JSON-LD. Verified against
 * `Context Knowledge/note tours.md` (parent folder, local-only) on 21 Jul 2026.
 */

export const SITE = {
  name: 'Vidapiena',
  /** Production origin + base — must match astro.config.mjs */
  origin: 'https://leoitaly.github.io',
  instagram: 'https://www.instagram.com/vidapiena/',
  instagramHandle: '@vidapiena',
  /**
   * Francesco's business WhatsApp (from client profile).
   * ⚠ TODO(Leo): confirm this is the number to publish before launch (M6 gate).
   */
  whatsappNumber: '5521981481718',
  guide: {
    name: 'Francesco',
    yearsInRio: 9,
    languages: ['it', 'en', 'pt'] as const,
  },
} as const;

/** wa.me deep link with a per-locale prefilled message. */
export function whatsappLink(prefill: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(prefill)}`;
}
