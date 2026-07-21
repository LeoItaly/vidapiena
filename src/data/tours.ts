/**
 * The 4-tour catalog — operational facts only (no copy; copy lives in src/i18n/).
 * Source of truth: `Context Knowledge/note tours.md` (verified 21 Jul 2026).
 * Prices are the guide's published retail prices in BRL.
 */

export type TourId = 'rocinha' | 'vidigal' | 'tavares' | 'giorno';

export interface Tour {
  id: TourId;
  /** ISO-8601 duration for JSON-LD (PT3H = 3 hours) */
  isoDuration: string;
  /** Human duration is locale-formatted in the dictionaries */
  durationHours: number;
  maxGroup: number;
  /** Adult retail price per person, BRL. For `giorno` this is the lowest tier ("from"). */
  priceBRL: number;
  priceIsFrom: boolean;
  /** Confirmed only for Rocinha (≤12 years) */
  childPriceBRL?: number;
  meetingPoint: string;
  /** Photo key into src/assets/photos/ (filled by the M1 manifest) */
  image: string;
  /**
   * ⚠ TODO(Leo): live public listing URLs — not present in Context Knowledge.
   * Until confirmed, CTAs fall back to WhatsApp; badges link to platform homepages.
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
    isoDuration: 'PT3H',
    durationHours: 3,
    maxGroup: 19,
    priceBRL: 270,
    priceIsFrom: false,
    childPriceBRL: 180,
    meetingPoint: 'Av. Niemeyer 780, São Conrado',
    image: 'tour-rocinha',
    otaLinks: {},
  },
  {
    id: 'vidigal',
    isoDuration: 'PT2H30M',
    durationHours: 2.5,
    maxGroup: 19,
    priceBRL: 270,
    priceIsFrom: false,
    meetingPoint: 'Praça do Vidigal',
    image: 'tour-vidigal',
    otaLinks: {},
  },
  {
    id: 'tavares',
    isoDuration: 'PT2H30M',
    durationHours: 2.5,
    maxGroup: 20,
    priceBRL: 270,
    priceIsFrom: false,
    meetingPoint: 'Rua Bento Lisboa 72, Catete',
    image: 'tour-tavares',
    otaLinks: {},
  },
  {
    id: 'giorno',
    isoDuration: 'PT8H',
    durationHours: 8,
    maxGroup: 15,
    priceBRL: 780,
    priceIsFrom: true,
    meetingPoint: 'Hotel pick-up',
    image: 'tour-giorno',
    otaLinks: {},
  },
];

/** Universal facts (all favela tours): min 2 pax · mototaxi + community visitation fee included. */
export const MIN_PAX = 2;
