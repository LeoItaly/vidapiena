/**
 * Curated Google reviews — social proof for the Testimonials homepage band.
 *
 * Francesco's Google Business Profile (VIDAPIENA) carries a 5.0 rating over 200+
 * reviews (aggregate snapshot below, taken 22 Aug 2026). The list is a hand-picked,
 * VERBATIM subset — quoted faithfully, first name + initial only — and the section
 * links out to the live profile (the authoritative source) so anyone can read the
 * full set. Do NOT invent, reword or translate these: they are real customers'
 * words. Text was lightly whitespace-normalized (and stray emoji dropped); nothing
 * else was changed.
 *
 * This is the static "Layer 1" source. If the optional Featurable build-time fetch
 * is ever added, it can populate this same shape at build time and keep it fresh.
 * To refresh by hand: bump `count`, and add/swap entries from GOOGLE_REVIEWS.url.
 */

export const GOOGLE_REVIEWS = {
  /** Stable Google Maps place link (CID form) — opens the profile + its reviews. */
  url: 'https://www.google.com/maps?cid=18401636343902061049',
  /** Aggregate exactly as shown on the profile — snapshot 22 Aug 2026. */
  rating: 5,
  count: 209,
} as const;

export interface Review {
  /** Verbatim review text (lightly whitespace-normalized; never reworded). */
  quote: string;
  /** First name + initial — public on Google, kept short here. */
  author: string;
}

/* Ordered for the 3-column grid's visual rhythm (long → short), not by date. */
export const REVIEWS: Review[] = [
  {
    quote:
      "Visiting Favelas with Vidapiena is safe, unique and after the experience you gain a lot of rich knowledge about Brazilian culture and Favelas. He speaks very fluently English and Italian and he is very reliable and trustworthy. Go with him and you'll have a very good time, guaranteed!",
    author: 'Leonardo R.',
  },
  {
    quote:
      "Francesco is an amazing tour guide, he made us discover places and views in Rio we would have never been able to do by ourselves. He speaks many languages and he cares a lot about his clients, I really recommend him!",
    author: 'Serena C.',
  },
  {
    quote:
      "I had so much fun with Francesco in Vidigal! It was authentic, safe and very satisfying. The view was absolutely stunning. I will do it again next time I am in Rio!",
    author: 'Frangelis C.',
  },
  {
    quote:
      "I can highly recommend the Favela tour with Francesco. He gave us such a good impression how life is living in the Favela. Also I felt really safe with him during the whole tour.",
    author: 'Joana B.',
  },
  {
    quote:
      "Francesco was an amazing tour guide. I felt very safe throughout and left with a much better understanding of favelas. Would highly recommend!",
    author: 'Robin H.',
  },
  {
    quote:
      "Francesco is an outstanding guide — fun, knowledgeable and full of passion. The favela tour was the highlight of our trip!",
    author: 'Ana B.',
  },
];
