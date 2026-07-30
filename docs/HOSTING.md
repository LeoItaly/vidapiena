# Hosting — Cloudflare Workers

The site moved from GitHub Pages to Cloudflare Workers on 30 Jul 2026. The reason is
narrow: the back office at `/admin` needs a server runtime — login, sessions, photo
uploads, commits — and Pages has none.

**Nothing about the public site changed shape.** `output` is still `'static'`, all 27
public pages are prerendered, and images are still transformed at build time by sharp.
Only `/admin/*` runs on demand.

## What Leo has to do once (nothing deploys until this is done)

1. **Cloudflare account** — free plan is enough. Note the **Account ID** from the
   dashboard sidebar.
2. **API token** — My Profile → API Tokens → Create Token → template
   *"Edit Cloudflare Workers"*. Copy it; it is shown once.
3. **GitHub repo secrets** (Settings → Secrets and variables → Actions → *Secrets*):
   | Name | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the token from step 2 |
   | `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 1 |
4. **GitHub repo variable** (same page, *Variables* tab) — optional:
   | Name | Value |
   |---|---|
   | `SITE_ORIGIN` | the public origin, e.g. `https://vidapiena.com` |

   Leave it unset and the default in `astro.config.mjs` applies. It is a *variable*, not
   a secret — it is a public URL, and it drives `canonical`, `hreflang`, `og:image` and
   the sitemap.

The first deploy creates the Worker (named `vidapiena`) and provisions the `SESSION` KV
namespace automatically.

## Cost

£0/month at this traffic. The free plan gives 100,000 Worker requests/day and unlimited
static bandwidth. Two ceilings are worth remembering because the back office design is
shaped around them:

- **KV: 1,000 writes/day.** This is why sessions use a self-contained signed cookie
  rather than a per-request KV record, and why draft autosave is debounced.
- **Workers: 10 ms CPU per invocation** on the free plan. This is why password hashing
  uses PBKDF2 at workerd's 100,000-iteration cap rather than a heavier KDF — and why the
  admin password is *generated* with high entropy instead of chosen, since the strength
  has to come from the password, not the hash cost.

## Commands

```bash
npm run dev
```

Astro dev server on `:4321`. Since the adapter is installed this already runs in the
Workers runtime (workerd) via the Cloudflare Vite plugin.

```bash
npm run cf:dev
```

`wrangler dev` on `:8787` — serves the **built** output the way production does. Run
`npm run build` first. This is the one that exercises the real asset serving, the
`_headers` rules and the KV bindings in local mode.

```bash
npm run cf:check
```

`wrangler deploy --dry-run` — validates the config and prints the bundle size and
bindings. Needs no credentials, so it is the cheapest pre-flight before pushing.

```bash
npm run cf:deploy
```

Manual deploy. Normally unnecessary: pushing to `main` deploys via
`.github/workflows/deploy.yml`.

## Three things that will bite you

**`imageService: 'compile'` in `astro.config.mjs` is mandatory.** The adapter's default is
`'cloudflare-binding'`, which moves image transformation to runtime Cloudflare Images — a
billable service, and a different pipeline from the build-time AVIF/WebP derivatives the
site already produces. Removing that line silently changes how every image on the site is
served.

**`base` must stay `'/'`.** A Worker serves at the root of its hostname, and the adapter
maps the assets directory onto `base`. With a non-root base, the served paths and the
emitted asset URLs disagree, and the adapter writes its synthesized `wrangler.json`
*inside* the served asset tree — where `.assetsignore` does not cover it.

**`compatibility_date` in `wrangler.jsonc` must not exceed what the installed `workerd`
supports.** The adapter prerenders inside the Workers runtime, so a too-new date fails the
**build**, not just `wrangler dev`. The error is explicit about the newest supported date.
Bump it only together with `wrangler`.

## The vidapiena.com cutover

The domain is not bought yet. When it lands:

1. Set the `SITE_ORIGIN` repo variable to `https://vidapiena.com`.
2. Update the absolute URLs in [`public/robots.txt`](../public/robots.txt) and
   [`public/llms.txt`](../public/llms.txt) — 12 occurrences. These are the GEO /
   AI-citation surface, so they matter more than they look.
3. Add the custom domain to the Worker in the Cloudflare dashboard.

That is the whole list. Everything else reads the origin through `SITE.origin`
(which reads `import.meta.env.SITE`) or `import.meta.env.BASE_URL`, so no component or
layout needs touching.

## Rollback

`main` deployed to GitHub Pages until this migration merged, and the Pages workflow is one
`git revert` away in the history. Pages also keeps serving its last successful build, so
reverting is a genuine fallback rather than a theoretical one.
