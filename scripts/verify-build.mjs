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

if (failed) {
  console.error('\nBuild verification FAILED.\n');
  process.exit(1);
}
console.log('  ✓ build verification passed\n');
