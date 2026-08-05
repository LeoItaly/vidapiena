import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOURS, type TourId } from './data/tours';

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
    /**
     * The tour this article is about — the one editorial decision the author makes
     * (a dropdown in the back office). It drives topical internal linking in both
     * directions (src/data/related.ts) and, later, article↔tour entity binding, so
     * a new article is cross-linked automatically instead of needing a code edit.
     * Optional: the shared "is a favela safe" piece belongs to every favela tour,
     * not one, so it carries no value and is cross-linked through the override in
     * related.ts instead.
     *
     * Derived from the catalog, not spelled out again. The back office validates a
     * chosen id against the SAME list (`TOUR_IDS` in lib/admin/draft-store.ts) and
     * silently drops anything else — so two hand-written copies that drifted apart
     * would quietly strip the field from a live article on its next publish, with
     * only a non-blocking warning from verify-build. One source, no drift.
     */
    relatedTour: z.enum(TOURS.map((t) => t.id) as [TourId, ...TourId[]]).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
