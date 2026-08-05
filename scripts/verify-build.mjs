/**
 * Post-build assertions that protect things a type-checker cannot see.
 *
 * Runs as part of `npm run build`, so it gates CI and therefore the deploy.
 *
 * ## 1. Nothing under /admin may be prerendered
 *
 * `astro.config.mjs` sets `output: 'static'`, which makes prerendering the
 * DEFAULT for every page. The back-office guard lives in `src/middleware.ts`,
 * and middleware only runs for on-demand routes — a prerendered page is a static
 * file served by Cloudflare's asset router, in front of the Worker, which never
 * consults the guard.
 *
 * So the single line `export const prerender = false` is the only thing standing
 * between a new admin page and publishing its contents to the open internet.
 * Every existing admin file carries it. Forgetting it on the next one is a
 * silent, total authentication bypass that looks completely normal in review —
 * and stage 4 adds several pages.
 *
 * Checking the built artifact rather than grepping the source is deliberate:
 * this asserts the property we actually care about (no static admin file was
 * emitted) rather than a proxy for it.
 *
 * ## 2. The client's data must not reach the public repo
 *
 * The repo is public. A phone number in a doc file was live on `main` for ten
 * days before anyone looked. This makes the next one fail the build instead.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CLIENT = 'dist/client';
let failed = false;

const fail = (message) => {
  console.error(`\n  ✗ ${message}`);
  failed = true;
};

const warn = (message) => {
  console.warn(`\n  ! ${message}`);
};

// ---------------------------------------------------------------------------
// 1. No prerendered admin routes
// ---------------------------------------------------------------------------
const adminDir = join(CLIENT, 'admin');
if (existsSync(adminDir)) {
  const leaked = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else leaked.push(relative(CLIENT, full).replace(/\\/g, '/'));
    }
  };
  walk(adminDir);
  fail(
    `The back office was PRERENDERED into ${CLIENT}/admin — it is served as a static\n` +
      `    file, in front of the Worker, so src/middleware.ts never runs and the page is\n` +
      `    readable by anyone. Add "export const prerender = false" to the page(s) below.\n\n` +
      leaked.map((f) => `      ${f}`).join('\n'),
  );
} else {
  console.log('  ✓ no prerendered /admin routes');
}

// ---------------------------------------------------------------------------
// 2. No client personal data in tracked source
// ---------------------------------------------------------------------------
/**
 * Patterns, not literal values — writing the number here to check for the number
 * would put it in the public repo, which is the thing being prevented.
 */
const FORBIDDEN = [
  { name: 'a Brazilian mobile number', re: /\+?55[\s-]?\(?\d{2}\)?[\s-]?9\d{4}[\s-]?\d{4}/ },
  { name: 'a CPF', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/ },
  { name: 'a CNPJ', re: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/ },
  { name: 'an IBAN', re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/ },
];

const SCAN_DIRS = ['src', 'docs', 'scripts', 'public', '.github'];
const SCAN_EXT = /\.(astro|ts|tsx|js|mjs|md|txt|json|yml|yaml|css)$/;

const scan = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.astro')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      scan(full);
      continue;
    }
    if (!SCAN_EXT.test(entry)) continue;
    const text = readFileSync(full, 'utf8');
    for (const { name, re } of FORBIDDEN) {
      const hit = text.match(re);
      if (hit) {
        fail(
          `${full.replace(/\\/g, '/')} contains what looks like ${name}.\n` +
            `    This repo is PUBLIC. Client personal data belongs in the local-only\n` +
            `    client profile, never here. Redact it, or narrow the pattern in\n` +
            `    scripts/verify-build.mjs if this is a false positive.`,
        );
      }
    }
  }
};
SCAN_DIRS.forEach(scan);
if (!failed) console.log('  ✓ no client personal data in tracked source');

// ---------------------------------------------------------------------------
// 3. The built pages must not carry the placeholder origin
// ---------------------------------------------------------------------------
/*
 * `astro.config.mjs` falls back to `https://vidapiena.workers.dev` when
 * SITE_ORIGIN is unset — a hostname nobody owns, because a Worker is served at
 * `<worker>.<account-subdomain>.workers.dev`. That value is baked into every
 * canonical, hreflang, og:url and sitemap entry across all 27 prerendered pages.
 *
 * The config already fails the build in CI. It cannot fail a LOCAL build,
 * because local builds legitimately run without the variable — but `npm run
 * cf:deploy` publishes exactly such a build, and every deploy so far has been a
 * local one. So the check that matters is at the deploy boundary, on the
 * artifact: run with `--deploy` and a placeholder origin is fatal.
 *
 * Shipping it would point the whole SEO/GEO surface off-site while every page
 * still rendered perfectly — invisible until Google indexed it.
 */
const PLACEHOLDER = 'https://vidapiena.workers.dev';
const deploying = process.argv.includes('--deploy');
const home = join(CLIENT, 'index.html');

if (existsSync(home) && readFileSync(home, 'utf8').includes(PLACEHOLDER)) {
  const message =
    `the built pages carry the PLACEHOLDER origin ${PLACEHOLDER}, which is a\n` +
    `    hostname nobody owns. Every canonical, hreflang, og:url and sitemap entry\n` +
    `    points off-site. Rebuild with the real origin first:\n\n` +
    `      SITE_ORIGIN=https://vidapiena.<subdomain>.workers.dev npm run build`;
  if (deploying) fail(`Refusing to deploy: ${message}`);
  else console.warn(`\n  ! Local build only: ${message}\n`);
} else if (existsSync(home)) {
  console.log('  ✓ built pages carry a real origin');
}

// ---------------------------------------------------------------------------
// 4. Every article is SEO/GEO-ready by construction
// ---------------------------------------------------------------------------
/*
 * An article Francesco publishes through /admin is only as discoverable as its
 * frontmatter makes it. Two properties are load-bearing and, if missing, fail
 * silently at runtime rather than at build:
 *
 *  - hreflang integrity — BaseHead emits the it⇄en alternate pair unconditionally,
 *    so whenever one locale is live (file present AND not a draft) the other must
 *    be too; a missing OR draft:true twin makes that alternate a live link to a
 *    404. Checked in BOTH directions — the publish flow always writes both twins
 *    non-draft, so any desync is a hand-edit, which is exactly the threat model.
 *    An empty description on a live page is an empty <meta description> / blog
 *    card. Both are FATAL: they degrade a page that still renders perfectly, so
 *    nothing else catches them.
 *  - topical wiring — a `relatedTour` is what makes an article appear on its tour
 *    page and link back to it. Its absence is a WARNING (some pieces genuinely
 *    belong to no single tour — those are listed in EXTRA_TOUR_POSTS in
 *    src/data/related.ts and exempted here), as is a description far outside the
 *    length a search result can show.
 *  - twin agreement on `relatedTour` — FATAL. The two files are read independently
 *    by the two locales' pages, so a value that differs between them makes the same
 *    article point at two different tours and appear on only one locale's tour page.
 *    Publish writes the id to both twins verbatim (it is never translated), so a
 *    divergence is a hand-edit — the same threat model as the hreflang check.
 */
const BLOG_IT = 'src/content/blog/it';
const BLOG_EN = 'src/content/blog/en';

const fmScalar = (fm, key) => {
  const m = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm').exec(fm);
  if (!m) return '';
  let raw = m[1].trim();
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1).replace(/''/g, "'");
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  return raw;
};

if (existsSync(BLOG_IT) || existsSync(BLOG_EN)) {
  // Slugs the safety-net override cross-links even without a relatedTour of their
  // own — read from the source of truth so this stays in step with related.ts.
  const overrideSlugs = new Set();
  if (existsSync('src/data/related.ts')) {
    const related = readFileSync('src/data/related.ts', 'utf8');
    const block = related.match(/EXTRA_TOUR_POSTS[\s\S]*?\{([\s\S]*?)\n\};/);
    if (block) for (const m of block[1].matchAll(/'([a-z0-9-]+)'/g)) overrideSlugs.add(m[1]);
  }

  // Read a locale folder into slug -> { draft, description, relatedTour }. Parsing
  // BOTH folders (not just it/) is what makes the checks below symmetric, so a
  // desync is caught whichever twin was hand-edited.
  const readLocale = (dir) => {
    const out = new Map();
    if (!existsSync(dir)) return out;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const text = readFileSync(join(dir, file), 'utf8');
      const fmEnd = text.indexOf('\n---', 4);
      const fm = text.startsWith('---\n') && fmEnd !== -1 ? text.slice(4, fmEnd) : '';
      out.set(file.replace(/\.md$/, ''), {
        draft: fmScalar(fm, 'draft') === 'true',
        description: fmScalar(fm, 'description'),
        relatedTour: fmScalar(fm, 'relatedTour'),
      });
    }
    return out;
  };

  const itPosts = readLocale(BLOG_IT);
  const enPosts = readLocale(BLOG_EN);

  const softWarnings = [];
  for (const slug of new Set([...itPosts.keys(), ...enPosts.keys()])) {
    const it = itPosts.get(slug);
    const en = enPosts.get(slug);
    // "Live" = a page is actually built for this locale: the file exists AND is not
    // a draft (getStaticPaths filters drafts out, so draft:true builds no page).
    const liveIt = Boolean(it) && !it.draft;
    const liveEn = Boolean(en) && !en.draft;

    // hreflang integrity, both directions: if one locale is live the other must be
    // too, or the emitted alternate points at a page that was never built.
    if (liveIt && !liveEn) {
      fail(
        `blog article "${slug}" is live in Italian but not in English (its en/ twin is\n` +
          `    missing or draft: true). The IT page emits a live hreflang="en" alternate to a\n` +
          `    page that is not built — a link to a 404. Publish writes both twins non-draft,\n` +
          `    so a lone or drafted twin means one was hand-edited.`,
      );
    } else if (liveEn && !liveIt) {
      fail(
        `blog article "${slug}" is live in English but not in Italian (its it/ twin is\n` +
          `    missing or draft: true). The EN page emits a live hreflang="it" alternate to a\n` +
          `    page that is not built — a link to a 404.`,
      );
    }

    // A built page with no description ships an empty <meta description> / blog card.
    if (liveIt && !it.description) {
      fail(`blog article "${slug}" (Italian) has no description — its <meta description> and blog card are empty.`);
    }
    if (liveEn && !en.description) {
      fail(`blog article "${slug}" (English) has no description — its <meta description> and blog card are empty.`);
    }

    // The two twins must name the SAME tour. Each locale's page reads its own file,
    // so a divergence silently splits the article's topical wiring in two.
    if (liveIt && liveEn && it.relatedTour !== en.relatedTour) {
      fail(
        `blog article "${slug}" names a different relatedTour in each locale —\n` +
          `    it/: ${it.relatedTour || '(none)'} · en/: ${en.relatedTour || '(none)'}. The id is locale-invariant\n` +
          `    and publish writes it to both twins verbatim, so this is a hand-edit. As it stands the\n` +
          `    two pages link to different tours and the article appears on only one locale's tour page.`,
      );
    }

    // Soft, non-blocking: SEO-softness. Length is judged on BOTH live twins — the
    // English one is machine-translated at publish and can land well outside the
    // band the Italian was written into.
    if (liveIt) {
      if (it.description && (it.description.length < 50 || it.description.length > 200)) {
        softWarnings.push(
          `"${slug}" (it): description is ${it.description.length} chars (aim 50–200; a search result shows ~120–160).`,
        );
      }
      if (!it.relatedTour && !overrideSlugs.has(slug)) {
        softWarnings.push(`"${slug}": no relatedTour — it won't appear on any tour page or link back to one.`);
      }
    }
    if (liveEn && en.description && (en.description.length < 50 || en.description.length > 200)) {
      softWarnings.push(
        `"${slug}" (en): description is ${en.description.length} chars (aim 50–200; a search result shows ~120–160).`,
      );
    }
  }

  // An override slug that matches no article exempts nothing and links nothing:
  // postsForTour skips a slug with no post (deliberately — never a dead link), so a
  // typo here fails silently on both sides.
  for (const slug of overrideSlugs) {
    if (!itPosts.has(slug)) {
      softWarnings.push(
        `EXTRA_TOUR_POSTS lists "${slug}", but src/content/blog/it/${slug}.md does not exist — that override links nothing.`,
      );
    }
  }

  if (softWarnings.length) {
    warn(
      `blog SEO/GEO soft checks (non-blocking):\n` +
        softWarnings.map((w) => `      ${w}`).join('\n'),
    );
  }
  if (!failed) console.log('  ✓ every published article is twinned it⇄en (both non-draft) with a description');
}

if (failed) {
  console.error('\nBuild verification FAILED.\n');
  process.exit(1);
}
console.log('  ✓ build verification passed\n');
