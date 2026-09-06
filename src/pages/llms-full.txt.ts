import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { TOURS, type Tour } from '../data/tours';
import { MENTIONS } from '../data/mentions';
import { liveArticles } from '../data/related';
import { t } from '../i18n';

/**
 * llms-full.txt — the DEEP AI-citation surface. Where llms.txt is the index,
 * this carries the full per-tour facts, the complete FAQ and the blog list, so
 * an assistant can answer detailed questions ("what's included in the Rocinha
 * tour", "is it safe", "how much for 4 people on the full-day tour") from a
 * single fetch. Prerendered; every URL is built from SITE.origin.
 *
 * Facts import from src/data + the EN dictionary — the same sources that render
 * the pages — so this file cannot drift from the live site.
 */
export const prerender = true;

const o = SITE.origin;
const dict = t('en');

const durationText = (tour: Tour) =>
  tour.durationHours === 2.5 ? '2.5 hours' : `${tour.durationHours} hours`;

const priceText = (tour: Tour) => {
  if (tour.priceTiers) {
    /* No "from" here. Tiers fall as the group grows, so `from €${tour.priceEUR}`
       named the most EXPENSIVE band as the entry price — and leading with the
       cheapest instead would have put a number below Viator's own €207 headline
       into AI answers (rate parity, 22/08). Lead with the headline band and let
       the full table speak. */
    return `${tour.priceTiers
      .map((x) => `€${x.priceEUR} per person for ${x.minPax}–${x.maxPax} people`)
      .join('; ')}`;
  }
  const child = tour.childPriceEUR ? ` (children up to 12: €${tour.childPriceEUR})` : '';
  return `€${tour.priceEUR} per person${child}`;
};

const tourBlocks = TOURS.map((tour) => {
  const name = dict.tours.items[tour.id].name;
  const item = dict.tourPage.items[tour.id];
  const includes = item.includes.map((i) => `  - ${i}`).join('\n');
  const faq = item.faq.map((f) => `  Q: ${f.q}\n  A: ${f.a}`).join('\n');
  return `### ${name}
- Duration: ${durationText(tour)}
- Group: min ${tour.minPax}, max ${tour.maxGroup} people
- Price: ${priceText(tour)}
- Meeting point: ${tour.meetingPoint}, Rio de Janeiro
- Included:
${includes}
- Page: ${o}/tour/${tour.slug}/ · EN: ${o}/en/tour/${tour.slug}/
- FAQ:
${faq}`;
}).join('\n\n');

/**
 * Third-party mentions, built from the same two sources as the homepage rail
 * (data/mentions.ts + the EN dictionary), so this citation surface can neither
 * claim coverage the site does not show nor fall behind when a mention is
 * added. Hard facts only — the dictionary's `lead` is written in Francesco's
 * first person for the card, and would break this file's third-person voice.
 */
const mentionBlocks = MENTIONS.map((mention) => {
  const item = dict.press.items[mention.key];
  const headline = 'quote' in item ? ` Headline: "${item.quote}"` : '';
  const rated =
    mention.rating !== undefined
      ? ` Rated ${mention.rating.toFixed(1)} from ${mention.reviewCount} reviews.`
      : '';
  return `- ${mention.outlet} — ${item.kind} (${item.meta}).${headline}${rated}
  ${mention.url}`;
}).join('\n');

const commonFaq = dict.tourPage.faqCommon.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');

const render = (articles: { slug: string; title: string }[]) => `# Vidapiena — full reference

> Vidapiena is Francesco's tour brand in Rio de Janeiro, Brazil. Francesco is an
> Italian native speaker who has lived in Rio for 9 years and leads small-group
> walking tours of Rio's favelas plus a full-day city tour, in Italian, English
> and Portuguese. Instagram: ${SITE.instagram}

## Trust

- Participants are covered by a personal-accident insurance policy (Porto Seguro), valid through 30 June 2027.
- Vidapiena is a registered Brazilian business (MEI), active since January 2025.
- Booking is direct with Francesco: WhatsApp (https://wa.me/${SITE.whatsapp}) or Instagram DM (${SITE.instagram}), for a personalised, made-to-measure service. Also listed on Viator, GetYourGuide, Airbnb Experiences and Civitatis.

## Independent coverage

Third-party pages that mention Vidapiena. Francesco neither owns nor controls
these, so they corroborate the facts above rather than restate them.

${mentionBlocks}

## Tours

${tourBlocks}

## Common questions (all tours)

${commonFaq}

## Blog

${articles.map((a) => `- ${a.title}\n  IT: ${o}/blog/${a.slug}/ · EN: ${o}/en/blog/${a.slug}/`).join('\n')}

## Pages

- Home (IT): ${o}/ · EN: ${o}/en/
- The guide: ${o}/la-guida/ · EN: ${o}/en/la-guida/
- Contact: ${o}/contatti/ · EN: ${o}/en/contatti/
- Blog: ${o}/blog/ · EN: ${o}/en/blog/
`;

// The English twins, exactly the list llms.txt publishes — one helper, so the index
// and this deep reference cannot disagree about what the blog contains.
export const GET: APIRoute = async () =>
  new Response(render(await liveArticles('en')), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
