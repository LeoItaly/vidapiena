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

/** Base-path-aware path for a locale root ('' → '/vidapiena/', 'en' → '/vidapiena/en/'). */
export function localeHref(locale: Locale, hash = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = locale === DEFAULT_LOCALE ? `${base}/` : `${base}/${locale}/`;
  return `${path}${hash}`;
}

/** Absolute URL (origin + base) for canonical/hreflang/OG/JSON-LD. */
export function absoluteUrl(pathWithBase: string): string {
  return new URL(pathWithBase, SITE.origin).href;
}

export function ogLocale(locale: Locale): string {
  return locale === 'it' ? 'it_IT' : 'en_US';
}
