// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Deployed to GitHub Pages (project site) until the custom domain lands.
// Custom-domain switch later: set `site` to the domain, `base` to '/', add public/CNAME.
export default defineConfig({
  site: 'https://leoitaly.github.io',
  base: '/vidapiena',
  output: 'static',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'it', locales: { it: 'it', en: 'en' } },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
