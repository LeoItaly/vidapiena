/**
 * Topical clustering — which blog posts belong to which tour, and back. Internal
 * links between a tour and the stories about it help both crawlers (crawl depth,
 * topical relevance) and readers.
 *
 * The mapping is DERIVED from each article's `relatedTour` frontmatter (set once,
 * from a dropdown in the back office), not a hand-maintained list. So a newly
 * published article is cross-linked automatically — appearing on its tour's page
 * and linking back to it — with no code edit. Slugs are locale-invariant
 * (pagePath adds the /en prefix); titles come from the collection, so they always
 * match the live articles and a stale entry can never become a dead link.
 */
import { getCollection } from 'astro:content';
import { TOURS, type TourId } from './tours';
import { pagePath, type Locale } from '../i18n';

/**
 * Cross-cutting posts that belong to more than one tour.
 *
 * `relatedTour` is a single choice, but the "is a favela safe?" piece is shared by
 * every favela tour and belongs to none in particular — so it carries no
 * `relatedTour` and is attached here instead. This is an editorial escape hatch
 * (Leo's, not the author's): the vast majority of articles are wired purely by
 * their frontmatter. Keyed by tour → extra post slugs, appended after the
 * frontmatter-derived posts.
 */
export const EXTRA_TOUR_POSTS: Record<TourId, string[]> = {
  rocinha: ['visitare-una-favela-e-sicuro'],
  vidigal: ['visitare-una-favela-e-sicuro'],
  tavares: ['visitare-una-favela-e-sicuro'],
  giorno: [],
};

export interface RelatedItem {
  label: string;
  href: string;
}

const slugOf = (id: string) => id.replace(/^(it|en)\//, '');
const tourSlug = (id: TourId) => TOURS.find((t) => t.id === id)!.slug;

/**
 * How many stories a tour page lists. The block sits under the booking call to
 * action, so it is a nudge, not an archive — and the list is newest-first with the
 * tour's own stories ahead of the shared ones, so the cap only ever trims the tail.
 */
const MAX_POSTS_PER_TOUR = 4;

/**
 * The blog posts for a tour's "Dal blog" block, newest-first: every article whose
 * `relatedTour` names this tour, then any cross-cutting posts from
 * `EXTRA_TOUR_POSTS`. `excludeSlug` drops the current article (used from a post to
 * list its siblings). Titles/hrefs are in `locale`; a slug with no matching post
 * in that locale is skipped, never a dead link.
 */
export async function postsForTour(
  tourId: TourId,
  locale: Locale,
  excludeSlug?: string,
): Promise<RelatedItem[]> {
  const posts = await getCollection('blog', ({ data }) => data.locale === locale && !data.draft);
  const bySlug = new Map(posts.map((p) => [slugOf(p.id), p]));

  const derived = posts
    .filter((p) => p.data.relatedTour === tourId)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((p) => slugOf(p.id));

  const extras = (EXTRA_TOUR_POSTS[tourId] ?? []).filter((s) => !derived.includes(s));

  return [...derived, ...extras]
    .filter((s) => s !== excludeSlug)
    .flatMap((s) => {
      const p = bySlug.get(s);
      return p ? [{ label: p.data.title, href: pagePath(locale, `blog/${s}/`) }] : [];
    })
    .slice(0, MAX_POSTS_PER_TOUR);
}

/**
 * The reverse of `EXTRA_TOUR_POSTS`: the tours an override attaches this post to.
 *
 * Only meaningful for a post with no `relatedTour` of its own — without it a
 * cross-cutting article is linked *from* several tour pages and links back to
 * none, which is a dead end for a reader and for a crawler. Pure: the override is
 * a literal, so no collection read. Catalog order, so the list reads the same way
 * the tours do everywhere else on the site.
 */
export function toursForPost(slug: string): TourId[] {
  return TOURS.map((t) => t.id).filter((id) => EXTRA_TOUR_POSTS[id].includes(slug));
}

/**
 * Every live article in one locale, newest-first — the list both AI-citation
 * surfaces (llms.txt, llms-full.txt) publish. Shared rather than written twice so
 * the index and the deep reference can never disagree about what the blog contains.
 */
export async function liveArticles(locale: Locale): Promise<{ slug: string; title: string }[]> {
  const posts = await getCollection('blog', ({ data }) => data.locale === locale && !data.draft);
  return posts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((p) => ({ slug: slugOf(p.id), title: p.data.title }));
}

/** The tour link itself (name + tour-page href) for a post's "this story is about" line.
 *  The caller passes the tour id straight from the post's own frontmatter
 *  (post.data.relatedTour), so no by-slug lookup — and thus no locale coupling — is
 *  needed here. */
export function tourLink(tourId: TourId, locale: Locale, label: string): RelatedItem {
  return { label, href: pagePath(locale, `tour/${tourSlug(tourId)}/`) };
}
