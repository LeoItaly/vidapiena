/**
 * The 4-tour catalog — operational facts only (no copy; copy lives in src/i18n/).
 * Source of truth: `Context Knowledge/note tours.md` (verified 21 Jul 2026).
 * Prices are the guide's published retail prices in BRL.
 */

export type TourId = 'rocinha' | 'vidigal' | 'tavares' | 'giorno';

export interface Tour {
  id: TourId;
  /** URL slug — locale-invariant (only the /en prefix differs between locales). */
  slug: string;
  /** ISO-8601 duration for JSON-LD (PT3H = 3 hours) */
  isoDuration: string;
  /** Human duration is locale-formatted in the dictionaries */
  durationHours: number;
  minPax: number;
  maxGroup: number;
  /** Adult retail price per person, BRL. For `giorno` this is the lowest tier ("from"). */
  priceBRL: number;
  priceIsFrom: boolean;
  /** Confirmed only for Rocinha (≤12 years) */
  childPriceBRL?: number;
  /** Per-person BRL price by group size — `giorno` only. */
  priceTiers?: { minPax: number; maxPax: number; priceBRL: number }[];
  meetingPoint: string;
  /** Photo key into src/assets/photos/ (filled by the M1 manifest) */
  image: string;
  /**
   * Curated gallery keys (src/assets/photos), same provenance rules as every
   * photo on the site. [0] doubles as the detail page's hero image.
   * TODO(Leo): expand via `npm run photos` from the 54 originals (privacy rule).
   */
  galleryKeys: string[];
  /**
   * Live public listing URLs (collected + verified 21 Jul 2026 — full matrix
   * and caveats in `Context Knowledge/OTA-LINKS.md`, local-only). Only live
   * platforms carry a key: a missing platform renders no badge, never a
   * placeholder. Booking sections, card icons and JSON-LD sameAs all read
   * this one map.
   */
  otaLinks: {
    viator?: string;
    getyourguide?: string;
    civitatis?: string;
    airbnb?: string;
  };
}

export const TOURS: Tour[] = [
  {
    id: 'rocinha',
    slug: 'favela-tour-rocinha',
    isoDuration: 'PT3H',
    durationHours: 3,
    minPax: 2,
    maxGroup: 19,
    priceBRL: 270,
    priceIsFrom: false,
    childPriceBRL: 180,
    meetingPoint: 'Av. Niemeyer 780, São Conrado',
    image: 'tour-rocinha',
    galleryKeys: ['tour-rocinha', 'zone-3-becos'],
    otaLinks: {
      viator:
        'https://www.viator.com/tours/Rio-de-Janeiro/Favela-Tour-Rocinha-a-Rio-de-jainero/d712-5667099P3',
      getyourguide:
        'https://www.getyourguide.com/rio-de-janeiro-l9/rio-de-janeiro-rocinha-favela-guided-tour-with-mototaxi-t1356093/',
    },
  },
  {
    id: 'vidigal',
    slug: 'favela-tour-vidigal',
    isoDuration: 'PT2H30M',
    durationHours: 2.5,
    minPax: 2,
    maxGroup: 19,
    priceBRL: 270,
    priceIsFrom: false,
    meetingPoint: 'Praça do Vidigal',
    image: 'tour-vidigal',
    galleryKeys: ['tour-vidigal', 'zone-1-mirante', 'zone-4-ladeira', 'marquee-4'],
    otaLinks: {
      viator:
        'https://www.viator.com/tours/Rio-de-Janeiro/Favela-Tour-Vidigal-a-Rio-de-Janeiro/d712-5667099P1',
      getyourguide:
        'https://www.getyourguide.com/rio-de-janeiro-l9/rio-de-janeiro-vidigal-favela-tour-with-local-guide-t1358085/',
      /* ⚠ live but calendar closed ("Sold out") as of 21/07 — see OTA-LINKS.md */
      airbnb: 'https://www.airbnb.com/experiences/7147633',
    },
  },
  {
    id: 'tavares',
    slug: 'favela-tour-tavares-bastos',
    isoDuration: 'PT2H30M',
    durationHours: 2.5,
    minPax: 2,
    maxGroup: 20,
    priceBRL: 270,
    priceIsFrom: false,
    meetingPoint: 'Rua Bento Lisboa 72, Catete',
    image: 'tour-tavares',
    galleryKeys: ['tour-tavares', 'marquee-3'],
    otaLinks: {
      viator:
        'https://www.viator.com/tours/Rio-de-Janeiro/Favela-Tour-Tavares-Bastos/d712-5667099P4',
      getyourguide:
        'https://www.getyourguide.com/rio-de-janeiro-l9/rio-de-janeiro-favela-tavares-bastos-tour-with-guide-t1358940/',
    },
  },
  {
    /* ⚠ maxGroup 15 vs 20 and min 2 vs 4 are unresolved in note tours.md —
       shipping the tier table's own bounds (2–15) until Francesco confirms. */
    id: 'giorno',
    slug: 'un-giorno-a-rio',
    isoDuration: 'PT8H',
    durationHours: 8,
    minPax: 2,
    maxGroup: 15,
    priceBRL: 780,
    priceIsFrom: true,
    priceTiers: [
      { minPax: 2, maxPax: 3, priceBRL: 1200 },
      { minPax: 4, maxPax: 6, priceBRL: 900 },
      { minPax: 7, maxPax: 15, priceBRL: 780 },
    ],
    meetingPoint: 'Hotel pick-up',
    image: 'tour-giorno',
    galleryKeys: ['tour-giorno', 'marquee-5'],
    otaLinks: {
      viator:
        'https://www.viator.com/tours/Rio-de-Janeiro/Il-Meglio-di-Rio-Cristo-Pan-di-Zucchero-e-Selaron-All-Inclusive/d712-5667099P5',
      getyourguide:
        'https://www.getyourguide.com/rio-de-janeiro-l9/rio-de-janeiro-full-day-highlights-tour-with-italian-guide-t1375161/',
      /* ⚠ live but calendar closed ("Sold out") as of 21/07 — see OTA-LINKS.md */
      airbnb: 'https://www.airbnb.com/experiences/7160484',
      /* ⚠ Civitatis sells this as private, per-group, Italian-only */
      civitatis: 'https://www.civitatis.com/it/rio-de-janeiro/tour-privato-rio-janeiro/',
    },
  },
];
