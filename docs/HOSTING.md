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
4. **GitHub repo variable** (same page, *Variables* tab) — **mandatory**:
   | Name | Value |
   |---|---|
   | `SITE_ORIGIN` | the public origin, e.g. `https://vidapiena.<subdomain>.workers.dev` |

   It is a *variable*, not a secret — it is a public URL — and it drives `canonical`,
   `hreflang`, `og:image` and the sitemap on all 27 prerendered pages.

   > ⚠️ **This is not optional, despite the fallback in `astro.config.mjs`.** A Worker is
   > served at `<worker>.<account-subdomain>.workers.dev`, so the fallback
   > `https://vidapiena.workers.dev` is a hostname nobody owns. Shipping it would point the
   > entire SEO/GEO surface off-site while every page still rendered perfectly — invisible
   > until Google indexed it. `astro.config.mjs` therefore **fails the build in CI** when
   > `SITE_ORIGIN` is unset. Find your subdomain under Workers & Pages → the Worker →
   > Settings → Domains & Routes, and set the variable to `https://` + that hostname.

The first deploy creates the Worker (named `vidapiena`) and provisions the `SESSION` KV
namespace automatically.

## Back-office credentials

Generate them once, locally — **both accounts in a single run**:

```bash
npm run admin:credentials -- "<indirizzo-di-francesco>" "Francesco" "<indirizzo-di-leo>" "Leo"
```

Use Francesco's real business address — the one he already uses on the OTA platforms, so
his phone's keychain matches it. It is in the client profile in the (local-only) parent
folder, deliberately not written down here: this repo is public.

It prints a generated ~62-bit Italian passphrase **per person**, one combined `ADMIN_USERS`
array, one `SESSION_SECRET`, and a ready-to-paste `.dev.vars` block for local work.
**Nothing is written to disk** — copy the passphrases before closing the terminal.

> Run it once with every account you want. Running it twice per person produces two
> `SESSION_SECRET`s (only one of which can be kept) and two single-element arrays that must
> be hand-merged — with `$` characters inside the hashes, pasted into an interactive prompt.
> A botched merge means nobody can log in, and it surfaces as "wrong password".

Then store the two secrets on the Worker.

> ⚠️ **The Worker must already exist**, so deploy first. `wrangler secret put` against a
> name that has never been deployed drops into an interactive "there doesn't seem to be a
> Worker called vidapiena — create one?" prompt, and answering yes creates an empty
> placeholder that the real deploy then has to overwrite. Order: **deploy → secrets**.
> Secrets take effect immediately and need no redeploy.

```bash
npx wrangler secret put ADMIN_USERS
```

```bash
npx wrangler secret put SESSION_SECRET
```

Francesco does not choose his own password, deliberately. The hash has to be cheap enough
to fit the free plan's 10 ms CPU budget (see **Cost** above), so it cannot carry the
security on its own — the generated ~62 bits of entropy does. A password someone invents
would be both weaker and, at a survivable iteration count, genuinely crackable if
`ADMIN_USERS` ever leaked.

Send it over a channel he already trusts, and **tell him to open the link in Safari, not
inside WhatsApp** — WhatsApp's in-app browser has its own cookie jar and cannot save to
the keychain, so he would log in there and appear logged out in Safari forever. The login
page detects this and says so, but the warning is easier to avoid than to read.

**There is no password reset.** His Outlook mailbox is full, so an emailed magic link is
the one recovery mechanism guaranteed to fail him. If he loses the passphrase, rotate
`ADMIN_USERS` and hand him a new one. Put this on the handover sheet.

To add a second person, keep both objects in the same JSON array.

### Revoking access

The session token carries a fingerprint of the password hash it was issued against, and
the guard re-checks it against live `ADMIN_USERS` on every request. So:

| To do this | Do this | Effect |
|---|---|---|
| Lock out a lost or stolen phone | rotate that user's entry in `ADMIN_USERS` | that person's sessions die immediately; everyone else stays signed in |
| Remove someone entirely | delete their object from the `ADMIN_USERS` array | their live session dies immediately |
| Sign **everyone** out at once | change `SESSION_SECRET` | every cookie everywhere is invalidated |

> This used to be untrue and it is worth knowing why. Before the fingerprint existed, a
> session re-signed itself from its own contents every ~65 days, forever, without ever
> consulting `ADMIN_USERS` — so rotating a password revoked nothing and the only real
> lever was `SESSION_SECRET`. If you read an older handover note saying otherwise, this
> table is the correct one.

### Turnstile (recommended, not yet configured)

Without it, the login is protected by the rate limiter (10 failed attempts per IP per 15
minutes) and the passphrase's entropy — adequate, but Turnstile is what actually stops
automated credential stuffing, and it is free and unlimited. Create a Managed-mode widget
in the Cloudflare dashboard, then:

| Where | Name | Value |
|---|---|---|
| Repo variable | `PUBLIC_TURNSTILE_SITE_KEY` | the site key |
| Worker secret | `TURNSTILE_SECRET_KEY` | the secret key |

> ⚠️ **Do these in that order, and let a deploy finish in between.** The two halves are
> not symmetrical:
>
> - `PUBLIC_TURNSTILE_SITE_KEY` is read as `import.meta.env.…`, which Vite inlines **at
>   build time**. It only takes effect after a rebuild *and* only if `deploy.yml` forwards
>   it to the Build step — it does now, but it did not originally, which meant the widget
>   could never render in production no matter what the dashboard said.
> - `TURNSTILE_SECRET_KEY` is a Worker secret and is live **the instant you set it**.
>
> Set the secret first and every login fails the bot check against a form that has no
> widget on it — a dead end with nothing to click. Francesco cannot diagnose that, and it
> is his only way in. Undo is `npx wrangler secret delete TURNSTILE_SECRET_KEY`.

The login form renders the widget only when the site key is present. A Turnstile failure
that is *not* an outright rejection (widget missing, or Cloudflare unreachable from Rio)
shows its own Italian message and deliberately does **not** count toward the lockout —
otherwise a flaky mobile connection would lock him out for 15 minutes for a network
problem. The rate limiter still locks an IP for 15 quiet minutes after 10 genuinely wrong
attempts.

## Turning publishing on (stage 5)

Until this is done the back office works completely except for the Pubblica
button, which says so in Italian rather than failing: *"La pubblicazione non è
ancora attiva su questo sito. Scrivi a Leo."*

**Create a fine-grained token**, not a classic one: GitHub → Settings →
Developer settings → Personal access tokens → **Fine-grained tokens**.

| Field | Value |
|---|---|
| Repository access | **Only select repositories** → `LeoItaly/vidapiena` |
| Contents | **Read and write** — the article commit |
| Actions | **Read** — the build-progress screen |
| Expiration | as long as allowed |

> ⚠️ **Never use a classic PAT here.** Its `repo` scope covers *every* repository
> on the account, so a compromise of this Worker would expose all of them instead
> of one public repo. A fine-grained token scoped to this repository cannot reach
> anything else.
>
> Understand what you are granting either way: **a push to `main` deploys the
> site**, so write access to this repo is write access to the live site.

```bash
npx wrangler secret put GITHUB_TOKEN
```

Then set `GITHUB_REPO` (a plain var, not a secret — it is a public URL) to
`LeoItaly/vidapiena`, in the Cloudflare dashboard under the Worker's Variables,
or in `.dev.vars` locally.

**The expiry is the thing that will bite.** When a fine-grained token expires,
the symptom is Francesco tapping Pubblica and getting *"Il collegamento con il
sito è scaduto… scrivi a Leo"* — deliberately worded so he stops retrying and
contacts you. `GET /admin/api/pubblica` returns the remaining days, so check it
occasionally, or put a reminder in the calendar for a month before it lapses.

To turn publishing back off: `npx wrangler secret delete GITHUB_TOKEN`.

## Regenerating Cloudflare types

`worker-configuration.d.ts` is generated and committed, because CI runs `astro check` and
needs it to resolve `cloudflare:workers` and the binding types. **Rerun it after any change
to `wrangler.jsonc`:**

```bash
npm run cf:types
```

Note `Astro.locals.runtime.env` was removed in Astro v6 — the supported way to reach a
binding is `import { env } from 'cloudflare:workers'`. See `src/lib/admin/runtime.ts`,
which is the single place the back office touches the platform.

## Cost

£0/month at this traffic. The free plan gives 100,000 Worker requests/day and unlimited
static bandwidth. Two ceilings are worth remembering because the back office design is
shaped around them:

- **KV: 1,000 writes/day.** This is why sessions use a self-contained signed cookie
  rather than a per-request KV record, and why draft autosave is debounced.
- **Workers: 10 ms active CPU per invocation** on the free plan, and `crypto.subtle`
  work counts against it (only network I/O is excluded). This is the tightest constraint
  in the whole back office. Measured cost of one PBKDF2-SHA-256 derive: **100,000
  iterations ≈ 19 ms, 50,000 ≈ 9 ms, 20,000 ≈ 3.7 ms** — so using workerd's 100,000
  cap would exceed the entire request budget and fail the login with error 1102. We use
  **20,000**, and the strength comes from *entropy* instead: the generated passphrase is
  ~62 bits, which leaves an offline attacker ~2^62 guesses. 62 bits at 20k iterations is
  far stronger than 100k iterations protecting a password a human chose.

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

## Verifying a deploy: wait before you believe it

`wrangler deploy` returns as soon as the upload finishes, but the new version
reaches every colo a little after that. Checking immediately tests the **previous**
version at some edges and the new one at others.

This produced two convincing false alarms in one session: a `Cache-Control`
header that was "missing" and two routes that were "404" — all four correct
about thirty seconds later. Give it **~30 seconds**, and check the same path
two or three times before concluding anything.

## Four things that will bite you

**`assets.not_found_handling` in `wrangler.jsonc` must stay `"none"`.** Set it to
`"404-page"` and the entire back office becomes unreachable from a browser. The asset
router sits in front of the Worker; with a not-found mode set, a *navigation* request
(`Sec-Fetch-Mode: navigate`) that matches no asset is answered by the asset router with
`dist/client/404.html` instead of falling through — and there is no `dist/client/admin`,
so `/admin` and `/admin/entra` both return the static 404 and the Worker never runs.

The trap is that it is **invisible to `curl`**: without the navigation headers the request
does fall through and the login works perfectly. That is exactly how this shipped
"verified" once already. Any future check of an on-demand route must use:

```bash
curl -si -H 'Sec-Fetch-Mode: navigate' -H 'Accept: text/html' http://127.0.0.1:8787/admin
```

`run_worker_first: ["/admin/*"]` looks like the surgical fix and is worse: once set,
anything that does *not* match is handled by the asset router and never reaches the
Worker, which breaks the adapter's own prerender server (it POSTs to collect static paths;
assets answer POST with 405) and fails the **build**.

## Three more things that will bite you

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
