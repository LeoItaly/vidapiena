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
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://vidapiena.workers.dev';

export default defineConfig({
  site: SITE_ORIGIN,
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
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
