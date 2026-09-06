/**
 * External mentions — the third-party pages that talk about Vidapiena, shown as
 * the homepage's scrollable "Parlano di me" rail (Press.astro).
 *
 * This file holds only the LOCALE-INDEPENDENT facts: the outlet's own name (a
 * proper noun — never translated), the URL (owned by SITE.press, never retyped
 * here) and any aggregate the source itself publishes. Every localized string —
 * what kind of mention it is, the pull-quote, the blurb, the CTA — lives in
 * `dict.press.items`, keyed by the same `key`, so a new mention is three edits:
 * a URL in site.ts, an entry here, and an item in it.ts + en.ts.
 *
 * Rendering is data-driven: an entry that carries `rating` renders as a STAT
 * card (the big figure), one without renders as a QUOTE card (the pull-quote
 * from its dict item). Nothing to wire in the component.
 *
 * Aggregates are hand-taken snapshots of what the source displays — not live
 * data. Note the date when you refresh one, the way reviews.ts does.
 */
import { SITE } from './site';

/** Keys are the contract between site.ts, this file and dict.press.items. */
export type MentionKey = 'voglioVivereCosi' | 'wanderboat';

export interface Mention {
  key: MentionKey;
  /** The outlet's own name, as it writes it. A proper noun — never translated. */
  outlet: string;
  /** Canonical URL of the piece or listing (single source: SITE.press). */
  url: string;
  /**
   * Aggregate score exactly as the source shows it, when it publishes one.
   * Present ⇒ the card renders as a stat instead of a pull-quote. Formatted
   * per-locale at render time, so the decimal separator follows the page.
   */
  rating?: number;
  /** Number of reviews behind `rating` — passed to the localized stat label. */
  reviewCount?: number;
}

/* Ordered strongest-first: the earned editorial feature leads, the platform
   listings follow. The rail scrolls, so the order IS the ranking. */
export const MENTIONS: Mention[] = [
  {
    key: 'voglioVivereCosi',
    outlet: 'Voglio Vivere Così',
    url: SITE.press.voglioVivereCosi,
  },
  {
    key: 'wanderboat',
    outlet: 'Wanderboat AI',
    url: SITE.press.wanderboat,
    // Snapshot taken 6 Sep 2026 from the listing's own JSON-LD aggregateRating.
    rating: 5,
    reviewCount: 132,
  },
];
