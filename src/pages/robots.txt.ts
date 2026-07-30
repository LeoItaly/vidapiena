import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

/**
 * Generated, not a static file in public/.
 *
 * It used to be public/robots.txt with the origin hard-coded, which meant the
 * `Sitemap:` line silently pointed at whatever host was current when someone last
 * remembered to edit it — and after the Cloudflare migration that was
 * `https://vidapiena.workers.dev`, a hostname nobody owns. Generating it from
 * SITE.origin (which reads `import.meta.env.SITE`, i.e. the SITE_ORIGIN repo
 * variable) makes the vidapiena.com cutover a one-value change with nothing left
 * to remember.
 *
 * Prerendered like every other public page, so this is a build-time string, not a
 * Worker invocation.
 */
export const prerender = true;

const body = `User-agent: *
Allow: /

# The back office is a login, not content. Keep it out of every index.
Disallow: /admin

Sitemap: ${SITE.origin}/sitemap-index.xml
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
