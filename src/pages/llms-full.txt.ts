import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { TOURS, type Tour } from '../data/tours';
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
    return `from R$${tour.priceBRL} per person (${tour.priceTiers
      .map((x) => `${x.minPax}–${x.maxPax} people: R$${x.priceBRL}`)
      .join('; ')})`;
  }
  const child = tour.childPriceBRL ? ` (children up to 12: R$${tour.childPriceBRL})` : '';
  return `R$${tour.priceBRL} per person${child}`;
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

const commonFaq = dict.tourPage.faqCommon.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');

const render = (articles: { slug: string; title: string }[]) => `# Vidapiena — full reference

> Vidapiena is Francesco's tour brand in Rio de Janeiro, Brazil. Francesco is an
> Italian native speaker who has lived in Rio for 9 years and leads small-group
> walking tours of Rio's favelas plus a full-day city tour, in Italian, English
> and Portuguese. Instagram: ${SITE.instagram}

## Trust

- Participants are covered by a personal-accident insurance policy (Porto Seguro), valid through 30 June 2027.
- Vidapiena is a registered Brazilian business (MEI), active since January 2025.
- Booking is on the tour platforms (Viator, GetYourGuide, Airbnb Experiences, Civitatis); direct contact via Instagram DM (${SITE.instagram}).

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
