import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog articles — Markdown under src/content/blog/<locale>/<slug>.md.
 * The same slug in both locale folders makes the two files hreflang
 * counterparts (the URL tail is locale-invariant, like every other page).
 * Francesco will edit these through the later back-office phase; until then
 * they are plain committed .md files. `draft: true` keeps a post out of the
 * build entirely.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    /**
     * Set when an already-published article is edited. Feeds `dateModified` in the
     * Article JSON-LD and an "Aggiornato il" line, so a rewrite is visible to
     * Google and to AI crawlers — without it an edit is indistinguishable from the
     * original publication, which defeats the freshness half of the SEO/GEO
     * strategy. Optional and additive: the ten existing articles stay valid.
     */
    updated: z.coerce.date().optional(),
    locale: z.enum(['it', 'en']),
    /** Optional photo key into src/assets/photos/ (see lib/photos.ts) */
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
