// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Deployed to Cloudflare Workers. The back office at /admin needs a server
// runtime (login, sessions, uploads, commits) and GitHub Pages has none —
// that is why the host moved. Every public page stays prerendered: `output`
// is still 'static' and only /admin/* opts out via `export const prerender = false`.
//
// `base` is '/' now: a Worker serves the site at the root of its hostname, and
// the adapter maps the assets directory to `base`, so a non-root base would make
// the served paths and the emitted asset URLs disagree.
//
// Custom-domain switch: set SITE_ORIGIN (or edit the default below) and update the
// absolute URLs in public/robots.txt + public/llms.txt. Nothing else — every
// component reads the origin through SITE.origin and import.meta.env.BASE_URL.
// `||` not `??`: an unset GitHub Actions variable arrives as an empty string,
// which is not nullish — `??` would let `site: ''` through and break the build.
//
// ⚠️ The fallback is a PLACEHOLDER and is not a reachable hostname. A Worker is
// served at `<worker>.<account-subdomain>.workers.dev`, so `vidapiena.workers.dev`
// belongs to nobody. `site` drives every canonical, hreflang, og:url and sitemap
// entry across all 27 prerendered pages, so shipping the fallback would point the
// entire SEO/GEO surface at a hostname we do not own — silently, since every page
// still renders. Hence the CI guard below: a deploy must state its origin.
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://vidapiena.workers.dev';

// Fail the build rather than deploy wrong canonical URLs. Local builds keep the
// placeholder (nothing is published from them); CI must be told the real origin
// via the SITE_ORIGIN repo variable — the account subdomain after the first
// deploy, then https://vidapiena.com at the cutover.
if (process.env.CI && !process.env.SITE_ORIGIN) {
  throw new Error(
    'SITE_ORIGIN is not set. Add it as a GitHub repo *variable* (Settings → Secrets and ' +
      'variables → Actions → Variables), e.g. https://vidapiena.<subdomain>.workers.dev. ' +
      'Without it every canonical URL, hreflang tag and sitemap entry would point at a ' +
      'hostname nobody owns.',
  );
}

export default defineConfig({
  site: SITE_ORIGIN,
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  // Moved out of the default './node_modules/.astro' so CI can cache it: `npm ci`
  // wipes node_modules, so with the default every one of the 545 image derivatives
  // was recomputed on every run. That is most of the 6–7 minute build, and the
  // build is what Francesco waits on after tapping Pubblica.
  cacheDir: './.astro-cache',
  adapter: cloudflare({
    // Do NOT drop this. The adapter's default is 'cloudflare-binding', which
    // moves image transformation to runtime Cloudflare Images — a billable
    // service, and a different pipeline from the 594 build-time AVIF/WebP
    // derivatives sharp already produces for our prerendered pages.
    // 'compile' keeps today's behaviour exactly.
    imageService: 'compile',
  }),
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Back-office secrets. Every one is `optional` on purpose: Astro validates
  // secrets at runtime, not at build, and marking them required would risk the
  // `astro check && astro build` deploy gate failing on a config problem rather
  // than a code one. Missing secrets instead make the login fail closed — see
  // src/lib/admin/session.ts (parseUsers returns no users, so nobody gets in).
  env: {
    schema: {
      /** HMAC key for the session cookie. Rotating it logs everyone out. */
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      /** JSON: [{ "email", "name", "hash" }] — see scripts/admin-credentials.mjs */
      ADMIN_USERS: envField.string({ context: 'server', access: 'secret', optional: true }),
      /** Turnstile. Both unset = the check is skipped, which is only allowed in dev. */
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },

  integrations: [
    sitemap({
      i18n: { defaultLocale: 'it', locales: { it: 'it', en: 'en' } },
      // The back office is a login, not content. Keep it out of the sitemap even
      // if a future /admin route is ever accidentally prerendered.
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
