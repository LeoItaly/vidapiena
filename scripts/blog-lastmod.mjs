import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Build a { '<pathname without trailing slash>': '<ISO date>' } map of blog-post
 * last-modified dates, read straight from the Markdown frontmatter (`updated`
 * falls back to `date`). Feeds @astrojs/sitemap's `serialize`, which stamps a
 * <lastmod> on each blog URL — the freshness signal Google and AI crawlers use
 * to tell a current page from a stale one.
 *
 * Runs at config-eval time in Node, so it reads the files directly. Frontmatter
 * dates are plain YYYY-MM-DD, so a tiny regex avoids pulling in a YAML parser.
 */
export function blogLastmod() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, '..', 'src', 'content', 'blog');
  /** @type {Record<string, string>} */
  const map = {};

  for (const locale of ['it', 'en']) {
    const dir = join(root, locale);
    let files;
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.md'));
    } catch {
      continue; // locale folder may not exist yet
    }
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      if (slug === 'modello-articolo') continue; // the draft template
      const raw = readFileSync(join(dir, file), 'utf8');
      const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const fm = fmMatch ? fmMatch[1] : '';
      if (/^draft:\s*true/m.test(fm)) continue;
      const updated = fm.match(/^updated:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
      const date = fm.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
      const iso = updated?.[1] ?? date?.[1];
      if (!iso) continue;
      const prefix = locale === 'it' ? '' : '/en';
      map[`${prefix}/blog/${slug}`] = new Date(iso).toISOString();
    }
  }
  return map;
}
