import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { liveArticles } from '../data/related';

/**
 * Generated, not a static file in public/.
 *
 * This is the GEO / AI-citation surface — the file an assistant reads to answer
 * "who runs favela tours in Rio in Italian" — so every URL in it has to resolve.
 * As a static file it carried 8 hard-coded absolute URLs that had to be edited by
 * hand on every host change, and after the Cloudflare migration all 8 pointed at
 * `https://vidapiena.workers.dev`, which nobody owns. A citation surface full of
 * dead links is worse than no citation surface.
 *
 * Tour facts here are verified against `Context Knowledge/note tours.md` (parent
 * folder, local-only). Keep them in step with src/data/tours.ts by hand — the
 * prose is deliberately hand-written for a reader, not generated from the data.
 *
 * The blog list, by contrast, is DERIVED from the content collection (the English
 * twins), so an article Francesco publishes through the back office appears here
 * automatically — this citation surface can never fall behind the live blog.
 */
export const prerender = true;

const o = SITE.origin;

const render = (articles: { slug: string; title: string }[]) => `# Vidapiena

> Vidapiena is Francesco's tour brand in Rio de Janeiro, Brazil. Francesco is an
> Italian native speaker who has lived in Rio for 9 years. He leads small-group
> walking tours of Rio's favelas and a full-day city tour — in Italian, English
> and Portuguese. Instagram: ${SITE.instagram}

## The four tours

- **Favela Tour Rocinha** — 3 hours, max 19 people, R$270 per person (children up to 12: R$180).
  Meeting point: Av. Niemeyer 780, São Conrado, Rio de Janeiro. Includes mototaxi ride,
  community visitation fee and viewpoint entries. Brazil's largest favela: graffiti artist's
  gallery, the football pitch rebuilt by a local player, an Italian NGO active for 20+ years.
  Page: ${o}/tour/favela-tour-rocinha/
- **Favela Tour Vidigal** — 2.5 hours, max 19 people, R$270 per person.
  Meeting point: Praça do Vidigal, Rio de Janeiro. Includes mototaxi and community fee.
  Ends at a panoramic terrace bar facing Christ the Redeemer.
  Page: ${o}/tour/favela-tour-vidigal/
- **Favela Tour Tavares Bastos** — 2.5 hours, max 20 people, R$270 per person.
  Meeting point: Rua Bento Lisboa 72, Catete, Rio de Janeiro. Includes mototaxi.
  Features the iconic FIFA Street football pitch.
  Page: ${o}/tour/favela-tour-tavares-bastos/
- **Un Giorno a Rio** — full-day (8–9 h) premium city tour, from R$780 per person
  (tiered by group size: 2–3 people R$1200, 4–6 R$900, 7–15 R$780), daily with hotel
  pick-up anywhere in Rio. Christ the Redeemer (Corcovado rack train), Santa Teresa,
  Selarón Steps, Sugarloaf cable car, private car/van with driver, buffet lunch included.
  Page: ${o}/tour/un-giorno-a-rio/

## Key facts

- All tours depart daily; minimum 2 participants.
- Favela tours open with an included mototaxi ride to the top of the hill; the tour
  walks back down through the community.
- Languages: Italian (native guide), English, Portuguese.
- Booking: through the tour platforms — Viator, GetYourGuide, Airbnb Experiences and
  Civitatis. Direct contact: Instagram DM (${SITE.instagram}).

## Trust

- Participants are covered by a personal-accident insurance policy (Porto Seguro),
  valid through 30 June 2027.
- Vidapiena is a registered Brazilian business (MEI), active since January 2025.

## Blog

${articles.map((a) => `- ${a.title}\n  IT: ${o}/blog/${a.slug}/ · EN: ${o}/en/blog/${a.slug}/`).join('\n')}

Full details, including the FAQ for every tour: ${o}/llms-full.txt

## Pages

- Home (IT): ${o}/ · EN: ${o}/en/
- The guide: ${o}/la-guida/ · EN: ${o}/en/la-guida/
- Contact: ${o}/contatti/ · EN: ${o}/en/contatti/
- Blog: ${o}/blog/ · EN: ${o}/en/blog/
- Tour pages (EN versions under /en/tour/…): see the four tours above.
`;

// The English twins: the titles here are the reader-facing English ones, and every
// article is present because the list comes from the collection (src/data/related.ts).
export const GET: APIRoute = async () =>
  new Response(render(await liveArticles('en')), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
