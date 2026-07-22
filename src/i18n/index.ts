import { it } from './it';
import { en } from './en';
import { SITE } from '../data/site';

export type Locale = 'it' | 'en';
export const LOCALES: Locale[] = ['it', 'en'];
export const DEFAULT_LOCALE: Locale = 'it';

export type Dict = typeof it;
const dictionaries: Record<Locale, Dict> = { it, en };

export function t(locale: Locale): Dict {
  return dictionaries[locale];
}

/**
 * Base-path-aware URL for any page. `path` is the locale-neutral tail — '' for
 * the home page, 'tour/favela-tour-rocinha/' for a subpage — identical in both
 * locales (only the /en prefix differs), which is what keeps the sitemap's
 * prefix-swapped hreflang alternates valid.
 */
export function pagePath(locale: Locale, path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const prefix = locale === DEFAULT_LOCALE ? `${base}/` : `${base}/${locale}/`;
  return `${prefix}${path}`;
}

/** Locale root, optionally with a hash — for links into the landing sections. */
export function localeHref(locale: Locale, hash = ''): string {
  return `${pagePath(locale)}${hash}`;
}

/** Absolute URL (origin + base) for canonical/hreflang/OG/JSON-LD. */
export function absoluteUrl(pathWithBase: string): string {
  return new URL(pathWithBase, SITE.origin).href;
}

export function ogLocale(locale: Locale): string {
  return locale === 'it' ? 'it_IT' : 'en_US';
}
