/**
 * Site-wide facts — locale-independent. Single source of truth shared by
 * components, copy dictionaries and JSON-LD. Verified against
 * `Context Knowledge/note tours.md` (parent folder, local-only) on 21 Jul 2026.
 *
 * Booking channel (client decision 19 Aug 2026 — reverses the 21 Jul "no
 * WhatsApp" decision): DIRECT via WhatsApp + Instagram. The OTA badges stay on
 * the site as unlinked "also on these platforms" proof, never booking links, so
 * website traffic converts to commission-free direct bookings. The WhatsApp
 * number below is Francesco's business line and is deliberately published (it is
 * the customer-facing booking channel) — allow-listed in scripts/verify-build.mjs.
 */

export const SITE = {
  name: 'Vidapiena',
  /** wa.me digits (country+area+number, no + or spaces) — the booking channel. */
  whatsapp: '5521981481718',
  /** Human-readable form for display next to the WhatsApp CTA. */
  whatsappDisplay: '+55 21 98148-1718',
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
   * External mentions — third-party pages that talk about Francesco/Vidapiena,
   * used by the homepage Press band (Press.astro) as authority proof. Single
   * source of truth for each URL; the per-item facts live in data/mentions.ts
   * and the localized chrome in dict.press.items, both keyed by the names below.
   *
   * Third-party coverage and directory listings, not owned profiles, so
   * deliberately NOT part of PERSON_SAMEAS (that is for profiles Francesco
   * controls — see SITE.profiles).
   */
  press: {
    /** Interview in the Italian expat magazine Voglio Vivere Così, April 2026. */
    voglioVivereCosi: 'https://www.voglioviverecosi.com/francesco-brasile.html',
    /**
     * Wanderboat AI's local-business listing for VIDAPIENA in Vidigal — an AI
     * trip-planning assistant that indexes the business, its hours and its
     * reviews, so it is the site's one visible foothold in an AI travel guide.
     * Percent-encoded exactly as Wanderboat publishes it in its own og:url and
     * JSON-LD; do NOT decode "regi%C3%A3o" or the link 404s.
     */
    wanderboat:
      'https://wanderboat.ai/local-businesses/brazil/regi%C3%A3o-geogr%C3%A1fica-imediata-do-rio-de-janeiro/vidapiena/81cLVeXvQt24YIjF4nHCRA',
  },
  tiktok: 'https://www.tiktok.com/@vidapiena',
  tiktokHandle: '@vidapiena',
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
 * and TikTok, plus whichever OTA profile URLs are filled in above. Used as JSON-LD `sameAs`
 * on the Person (About page) and the operator references, so search engines and
 * AI assistants resolve the site, the guide and the OTA listings as one entity.
 */
export const PERSON_SAMEAS: string[] = [
  SITE.instagram,
  SITE.tiktok,
  ...Object.values(SITE.profiles).filter(Boolean),
];
