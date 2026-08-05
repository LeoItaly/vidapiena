# Work Log

> Newest first. One entry per working session.

## 2026-08-05 (later) — Second-pass audit of the SEO/GEO article feature

Independent review of the entry below. The `relatedTour` flow itself came back clean —
traced set / cleared / re-opened / published, confirmed the id is never translated, and
checked the cross-links against the built HTML. Seven fixes, all inside that surface:

- **`/admin/api/assist` parsed an unbounded body.** Every cap (8 000 / 4 000 chars) ran
  *after* `request.json()` while the client sent the whole article — on 10 ms of CPU that
  is an error 1102 `wrangler dev` can never reproduce. Capped client-side + a
  `content-length` 413, as in `bozza.ts`.
- **verify-build §4 never compared `relatedTour` across twins** — a one-locale hand-edit
  shipped two pages linking to different tours. Now fatal. Added warnings for an
  `EXTRA_TOUR_POSTS` slug matching no file, and for the EN description length.
- **The tour-id list lived in three places.** `content.config.ts`'s enum is now derived
  from `TOURS`; drift would have silently stripped the field on the next publish
  (`sanitiseDraft` drops an unknown id, and the missing-value check only warns).
- **`unchanged()` in `bozza.ts` was key-order sensitive** — `en` and the two shas are
  re-added in the opposite order after a publish, so a no-op autosave spent a KV write.
  Now a fixed-order tuple (*not* a `JSON.stringify` replacer array, which would also
  filter nested block keys).
- **`visitare-una-favela-e-sicuro` was an internal-link dead end:** pointed at by three
  tour pages, pointing back at nothing. New `toursForPost()` + a `BlogPostPage` fallback;
  it now heads «I tour di questo racconto» with all three favela tours (new plural i18n
  key `blog.relatedTours`).
- **Housekeeping:** `postsForTour` capped at 4; `liveArticles()`, duplicated verbatim in
  both llms surfaces, moved into `related.ts`.

**Verified:** `astro check` 0/0/0 (123 files), build + verify-build clean with no soft
warnings. Publish simulation with a temp `zzz-test` twin pair → both llms files, top of
"Dal blog" on the Rocinha page, back-links in both locales; temp files removed and
rebuilt clean. Negative tests: divergent twin fails, missing EN twin still fails, both new
warnings fire. Editor client chunk still 21 KB, no `slugForTitle` / `checkDraft` leakage,
no `dist/client/admin`.

## 2026-08-05 — Back-office articles are SEO/GEO-ready on publish

Closed the gap where an article Francesco writes in `/admin` renders + gets sitemapped fine
but is **invisible to the AI-citation files** and **orphaned from tour internal-linking**
until code is hand-edited. Principle: SEO/GEO-readiness is now **structural, not authorial** —
he supplies one dropdown choice; the system manufactures the rest.

- **New `relatedTour` frontmatter field** (enum of the 4 tour ids), threaded through the whole
  publish pipeline: schema (`content.config.ts`), serializer (`frontmatter.ts`), draft model +
  sanitiser (`draft-store.ts`, validated against `TOURS`), the editor `<select>`
  (`scrivi.astro` + `admin-editor.ts`), the publish commit (`pubblica.ts` → **both** it+en
  twins, never translated), and the re-open path (`parse-markdown.ts` + `articolo.ts`).
- **Internal linking now DERIVES from frontmatter.** `src/data/related.ts` rewritten from the
  hand-maintained `TOUR_TO_POSTS`/`POST_TO_TOUR` maps into `getCollection`-backed helpers
  (`postsForTour`, `tourLink`) + a small `EXTRA_TOUR_POSTS` override for the cross-cutting
  safety post. `BlogPostPage.astro` reads the tour from the post's own `data.relatedTour`
  (works in either locale, one fewer query); `TourPage.astro` uses `postsForTour`. Backfilled
  `relatedTour` into the 5 existing twins so cross-links are byte-identical to before.
- **AI-citation files self-maintain.** `llms.txt` + `llms-full.txt` blog lists now derive from
  the EN-twin collection (async GET) instead of a hard-coded 5-item array.
- **Build guard** (`verify-build.mjs` §4): FATAL if a live article's twin is missing/`draft:true`
  or a live twin has an empty description — checked **both directions** (it⇄en); WARNS on
  SEO-softness (no `relatedTour`, description outside 50–200).
- **In-editor coaching** — a live "Pronto per Google" checklist (`seo-checklist.ts`, sharing
  thresholds with `publish-check.ts`) grades title/description/subtitle/tour-link/cover/alt as
  he types; guidance only, never a block.
- **AI-assist** — a "✨ Suggerisci un riassunto" button (`assist.ts` + `api/assist.ts`) drafts a
  meta description from the article via the free Workers AI binding, for him to accept/edit.

Verified: full `npm run build` green; a temp article proved end-to-end auto-wiring (appears in
`llms.txt` + on its tour page, links back) with zero code edits; backfill parity exact. A
4-dimension adversarial review flagged 2 latent bugs (the internal-link lookup + the build
guard were both one-directional on the it/en twin) — **both fixed** and the guard fix
confirmed with a negative test. **Not committed / not pushed** (push = deploy). Open prereqs
from the 04/08 sprint still stand (OTA profile URLs, GSC/Bing vars, IndexNow toggle).

## 2026-08-04 — Fix wrong photo in "is it safe to visit a favela" post

Francesco spotted (WhatsApp) that the blog post **`visitare-una-favela-e-sicuro`** showed a
**Vidigal** photo (`tour-vidigal.jpg`, caption "the favela over the sea where I live")
directly above the CTA **"discover the Rocinha Favela Tour"** — photo and link contradicted
each other. Swapped both twins (IT + EN) to `tour-rocinha.jpg` (the Brazil-flag-painted
staircase in Rocinha — unambiguously Rocinha, not used in any other post) and rewrote the
alt/caption to match the tour the section links to. Not pushed.

**Rule going forward:** in any blog/tour copy, the inline photo must match the place its CTA
links to — don't caption a Vidigal shot and then link Rocinha. Faces in photos are fine
(client confirmed — no "no faces" rule for the public site).

## 2026-08-03 — Domain cutover: riovidapiena.com is live

Bought and wired the real domain. `vidapiena.com` turned out to be squatted (registered
2024-03 via GoDaddy, parked) and `vidapiena.tours` was $48/yr, so we took the on-brand
`.com` modifier **`riovidapiena.com`** on Cloudflare Registrar (~$10.46/yr, auto-renew on).

- Attached `riovidapiena.com` + `www.riovidapiena.com` as Custom Domains on the `vidapiena`
  Worker; certs provisioned in minutes.
- Added a Redirect Rule `www.*` → apex (301, preserve query) — verified: `www` 301s to the
  naked domain keeping path + query.
- Flipped the `SITE_ORIGIN` repo variable to `https://riovidapiena.com` and re-ran the
  deploy so every canonical / hreflang / og:url / sitemap / robots.txt / llms.txt emits the
  new origin.
- Disabled the `vidapiena.leonardo-rodo.workers.dev` subdomain so the site isn't indexed
  twice.
- Refreshed [`HOSTING.md`](HOSTING.md) cutover section (the old "hand-edit robots/llms" step
  was obsolete — those are generated from `SITE.origin` now).

Ownership: Leo is registrant + payer; Francesco reimburses. No handover of domain / CF
account / repo yet. Email unchanged — Francesco keeps `vidapiena-riotours@outlook.com`.

## 2026-07-31 (later) — Back-office: exit navigation + unsaved-changes guard; drop the "no faces" rule

Leo, on Francesco's behalf: once you tap **«Scrivi un articolo»** there is no way
back — the editor is a long form whose only exit is the small header link, which
this client never finds. Ask: (1) a real "back" control, and if you leave with
unsaved work, be **asked whether to save**; (2) the same fix on the photo-upload
page; (3) delete the on-screen rule telling him **not to upload photos with faces**
— guests have agreed to appear, so the rule is no longer true.

- **Exit guard in [`admin-editor.ts`](../src/scripts/admin-editor.ts).** Every way
  out of the editor now runs through one `esciVerso(url, chiedi)`. The *exits*
  (a new `‹ I tuoi articoli` back link, plus the shell's home + logout links,
  wired from `document` since they live outside the editor root, and "Come si fa?")
  are `chiedi: true`: with unsaved work they open a small three-choice modal —
  **Salva ed esci · Esci senza salvare · Annulla** — styled with the shared `.btn`
  tokens (not `window.confirm`, which can't offer three answers). The forward steps
  (**Anteprima**, **Pubblica**) are `chiedi: false`: they save first, so the next
  page reads the current text instead of a stale KV copy. A failed save keeps him
  on the page with the reason already shown.
- **Honest "Esci senza salvare".** The editor auto-saves to KV on `pagehide`; that
  path now checks a `scartaAllUscita` flag so "don't save" actually leaves the
  server copy where it was. localStorage still holds the text (the phone-crash net,
  not a publish), so nothing is lost on the device. A `beforeunload` net covers
  reload/tab-close/hardware-back on desktop; it is a no-op on iOS Safari, where the
  existing `pagehide` beacon is the real safety, which is exactly why intercepting
  the in-app links is what makes iPhone safe.
- **[`foto.astro`](../src/pages/admin/foto.astro):** added the same `‹ I tuoi
  articoli` back link (photos + descriptions already save as they upload, so
  leaving loses nothing), and a `beforeunload` guard that only fires while a batch
  is still uploading, so a half-finished upload isn't abandoned mid-flight.
- **Removed the "no faces" disclosure.** Deleted the boxed «Una regola sola:
  niente foto in cui si riconoscono i visitatori in volto» notice in `foto.astro`,
  and reworded the *"Che foto posso usare?"* answer in
  [`aiuto.astro`](../src/pages/admin/aiuto.astro) to name no prohibition. ⚠️ The
  origin of that rule — `docs/DESIGN.md` §"Privacy rule … No identifiable guests"
  and its public-site photo-curation stance — was left untouched; that's a policy
  doc that also governs marquee/hero curation, so flag to Leo whether it should
  change too.
- **CF-types trap:** `.append(...children)` fails the build (the worker `Element`
  shadow types it as 1–2 args) — used `appendChild` per node, as the rest of the
  file does. Dropped the deprecated `event.returnValue`; modern `preventDefault()`
  alone raises the desktop prompt.
- **Verified** on the running dev server (minted a session cookie from the local
  `SESSION_SECRET`, since login is cookie-only): editor renders with the back link,
  the modal shows all three buttons with correct copy + computed styling (fixed,
  z-50, ink box, gold primary), **Annulla** stays, **Salva ed esci** saved and went
  to `/admin`, **Esci senza salvare** went to `/admin`; foto + aiuto confirmed
  clean of the faces text; no console errors. `astro check` clean (0/0/0, 114
  files). (An unrelated Vite `optimizeDeps` staleness error on `astro:content`
  pages showed up in the *shared* dev server after `astro check` re-synced content
  — environmental, self-heals on restart; build/deploy unaffected.)
- Local only, not pushed (push = deploy).

## 2026-07-31 (late) — OTA trust strip: drop the cream panel, drift the marks in white

Leo didn't like the home page's closing "Prenota Vidapiena anche su" section on
a front-end level: the floating cream panel felt heavy, and the logos sat still.
Ask: kill the background, make the marks auto-scroll horizontally, keep only the
logos. Two calls were his to make, so I asked — he chose **all-white/monochrome
marks** and **keep the heading**.

- **[`TrustBadges.astro`](../src/components/TrustBadges.astro) rewritten.** The
  `.badge-panel` (cream `bg-paper` card + box-shadow) is gone; the section is now
  a bare `bg-ink` band, so it merges seamlessly with FinalCta above and the ink
  Footer below — one continuous dark region instead of a boxed panel with two
  seams. Heading kept, recolored `text-ink/55` → `text-paper/55` for the dark bg.
- **The auto-scroll was already built** — the row has always carried the
  `data-marquee-*` hooks that [`marquees.ts`](../src/scripts/marquees.ts) drives
  (constant base drift + scroll-velocity boost, CSS `mq-drift` floor). It only
  *looked* static because it sat inside the centred panel and the pane forces
  reduced-motion. Made the row full-bleed (heading stays in `max-w-5xl`), so the
  strip drifts edge-to-edge behind the existing 8%/92% edge mask.
- **Legibility problem the panel was hiding.** On `#10150f`, Civitatis (pure
  `#000`) is invisible and Viator (dark-teal raster, no white master) near-so.
  Per Leo's choice, one uniform tint solves all four: `filter: brightness(0)
  invert(1)` collapses each mark to solid black (alpha kept) then lifts it to
  white — identical result on the inline SVG fills (Airbnb/GYG/Civitatis) **and**
  the transparent Viator PNG — at `opacity: 0.82` so it reads as a partner row,
  not a shout. This is a *whitening filter*, not a recolor of the source art;
  Airbnb/GYG/Civitatis all publish official reversed variants, Viator is the only
  bend. Component header comment + trademark note updated to say so honestly (the
  old comment claimed "no filters are ever applied to these marks").
- **Verified in the live DOM** (pane forces reduced-motion, so I drove it by
  hand): panel gone, section `rgb(16,21,15)`, all four marks
  `brightness(0) invert(1)` @ 0.82, heading present in off-white. Forced
  `.motion-ok` → all 4 sequences show, `mq-drift` runs, track translates left
  `0 → −99 → −296px` over the loop (2012px track = 4×503px seq → seamless).
  `astro check` clean (0/0/0, 114 files).
- Local only, not pushed (push = deploy).

## 2026-07-31 (night) — Photos go into the article from the phone, where he is standing

Client asked for a photo to be addable **inside the editor**, not only pickable
from a library filled on the separate /admin/foto page.

Reading the code first turned up why the ask exists: the two surfaces were never
connected. /admin/foto uploads against **its own draft id**, kept in localStorage
under `vp:bozza-foto`, while the editor's picker lists photos stored against the
**article's** draft id. Those are different KV prefixes, so nothing uploaded on
that page could ever appear in an article — and the editor's empty state said
*"Vai su «Foto» e caricane qualcuna"*, which sent him to do exactly the thing that
does not work. A new article's picker was therefore always empty, permanently.

- **Upload control in the photo block.** One `controlloCarica()` — a plain
  `<input type="file" accept="image/*">` inside a `<label>` (no contenteditable,
  no custom picker; on iOS that is what reliably opens the camera roll and offers
  "Scatta una foto"), 50 px tall, 16 px text so Safari does not zoom on focus. It
  runs the **existing** pipeline unchanged: `processPhoto` on the phone →
  `processAndUpload` → `POST /admin/api/foto`. Upload sits **above** the library
  grid and *is* the empty state; the grid and its "oppure scegli una foto che hai
  già caricato" heading only appear once there is something to choose from.
- **After upload:** the photo joins the shared `foto` array (so *every* block's
  picker refreshes), is auto-selected on the block, and the card is scrolled back
  under his thumb. The thumbnail renders from an **object URL of the bytes we just
  sent**, not a round-trip to the Worker — instant, and it saves ~400 KB of Rio
  mobile data per photo. `fotoUrl()` now resolves three kinds of photo (local
  blob → `pub:` committed → staged in KV) in one place.
- **The cover too.** Its `<select>` is server-rendered, so a photo added after
  page load was invisible to it — and on a *new* article the only way to get a
  cover was to make a photo block, upload, then delete the block. Same control now
  sits under the cover field, and new uploads are appended to the list.
- **One upload at a time**, editor-wide: two 24 MP decodes at once is how a phone
  runs out of memory, and on iOS `drawImage` fails *silently*. The second tap gets
  a sentence, not a queue.
- **/admin/foto is no longer a dead end.** Once a photo is stored it offers
  «Scrivi un articolo con queste foto» → `/admin/scrivi?bozza=<that same id>`, so
  the batch lands in an article's picker; the handoff clears `vp:bozza-foto` so
  the next visit starts a fresh batch instead of dragging every photo he ever
  uploaded into the next article (and eventually hitting the 40-photo cap).
- **Descriptions persist.** The block's description used to live only on the
  block, so the cover list went back to reading "Foto 1, Foto 2, Foto 3" on the
  next load — and a `<select>` has no thumbnails, so picking a cover was
  guesswork. One PATCH on blur (the route already skips the write when nothing
  changed, so an untouched field costs a read), plus `keepalive` on both this and
  /admin/foto's existing alt save — he types the last description and taps the
  next button in the same gesture, and a plain fetch dies with the navigation.
- Copy that had gone stale: the Foto block's hint ("Una delle foto che hai
  caricato" → "Una foto: la carichi qui dal telefono") and a new first Q&A in
  /admin/aiuto.

**Two bugs the walkthrough caught, both in the cover control** — the one control
that is created once and never redrawn, so unlike a photo block it cannot be
cleaned up by a repaint: a stale error (and its «Entra di nuovo» button) survived
under a cover that had since uploaded fine, and after a *successful* upload the
line sat there reading "La sto caricando…", which reads as stuck. Both fixed with
an explicit `pulisci()` on entry and on success.

**Verified** under `wrangler dev` on an isolated port + `--persist-to` (another
session held 8787), with a minted dev cookie, at a 375×812 viewport, driving the
real pipeline with real 900 KB+ archive photos: new article written with heading,
bold + italic, list and a directly-uploaded photo → "Vedi com'è" rendered
`p/h2/strong/em/ul/li/figure/figcaption` → `/admin/pubblica` reported *"L'articolo
è a posto"* (so publish-check accepts an in-editor upload end to end) · Rocinha
reopened via **Modifica** with `publishedSlug` frozen, the note reading
`/blog/rocinha-come-visitarla/`, the button reading **Aggiorna**, a paragraph
edited, and a `pub:` photo **swapped for a fresh upload** while the other kept its
`pub:` id · uploaded bytes confirmed 1200×1600 / 386 KB / EXIF-free and
byte-identical on the server · a WhatsApp-sized 640×480 rejected with the Italian
sentence in red, the block keeping its existing photo · double-tap refused with
"Sto ancora caricando l'altra foto" · /admin/foto handoff carried its batch *and*
its descriptions into a new article. `astro check` 0 errors · full `npm run build`
green (verify-build passes).

**Then merged to `main` and deployed — this was the Pages → Workers cutover.**
`main` had been running the *GitHub Pages* workflow all along (it had no
`wrangler.jsonc` at all); the Workers deploys until now were manual `cf:deploy`
runs off this branch. Merging replaced `deploy.yml`, so a push to main now builds
and deploys the Worker. Note `gh run list` shows the *current* name for a workflow
path against *old* runs, so those earlier "Deploy to Cloudflare Workers ✓" rows on
main were really Pages runs — misleading if you are reconstructing the history.

⚠️ **New CI trap, cost one red build.** The first CI build with `wrangler.jsonc`
present died before rendering a page: *"Failed to start the remote proxy session
… necessary to set a CLOUDFLARE_API_TOKEN"*. `ai` is a **remote-only** binding —
Workers AI has no local emulation — so the adapter's prerenderer opens a remote
proxy session against the real account *at build time*. The token was scoped to
the deploy step only. It passes on a dev machine regardless, because
`wrangler login` leaves an OAuth token in the keyring that the session picks up:
the same shape as every other trap here — it only fails where nobody is watching.
Fixed by giving the Build step `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

Live and verified on `https://vidapiena.leonardo-rodo.workers.dev`: homepage 200 ·
`/admin` **as a navigation request** 302s to `/admin/entra` (the asset-router trap
is not biting) · `/admin/api/*` returns the 401 Italian JSON when logged out ·
canonical/hreflang carry the real origin · blog page and sitemap 200.

🔑 **Open — Francesco has no login yet (almost certainly).** The local `.dev.vars`
holds exactly one account, Leo, and `push-secrets.mjs` is what pushed
`ADMIN_USERS` to the Worker, so production is Leo-only. It cannot be read back to
confirm (secrets are write-only, and the login is deliberately timing-safe, so
probing an address tells you nothing). Creating his account is one local run —
see docs/HOSTING.md; it must include **both** people, since the secret is the
whole array and pushing Francesco alone would lock Leo out.

⚠️ Note for whoever tests next: the Browser pane never has document focus, so
**focus/blur events do not fire there at all** (`document.hasFocus()` is false).
Anything blur-driven — both alt-save paths — has to be exercised by dispatching
the event directly; a real tap was not reproducible in the pane.

## 2026-07-31 (even later) — Back office: WordPress/Gutenberg-style article editing

Client liked the block editor and asked for it to feel more like WordPress: open
an **already-online article and edit it**, per-card **action icons** (modify /
delete / update), a **live preview** to see changes as in WordPress, and richer
**inline formatting** ("bold, numbers… study the Gutenberg"). Confirmed two
directions first: keep the phone-reliable **textareas** (styled blocks + live
preview, *not* contenteditable — the iOS reason still holds), and make delete of a
live article a **reversible "take offline"**, not a destroy.

Four phases, all on `cloudflare-migration`, none pushed:

- **Edit existing articles.** New `parse-markdown.ts` — `markdownToBlocks`, the
  exact inverse of `blocksToMarkdown`, so any published `.md` (incl. the five
  hand-written seeds) reopens in the editor. New `POST /admin/api/articolo`
  `apri-modifica` seeds a draft from the collection entry's raw `body` + `data`,
  freezes `publishedSlug` (→ the flow is "Aggiorna", same URL), and dedupes by slug
  so re-opening never piles up drafts. Committed photos come back as a **`pub:<key>`
  sentinel** `fotoId`: served for display by new `foto-pubblicata.ts` (GitHub raw
  media, no base64 decode → within the 10 ms CPU budget), and at publish they
  **pass through by key with no blob upload**, with new staged photos numbered
  *past* any existing `blog-<slug>-NN` so they can't collide. `sanitiseDraft` /
  `publish-check` / `pubblica` all learned the sentinel.
- **Card icons + take-offline.** `index.astro` rebuilt: every card has an SVG icon
  toolbar (`IconaAzione.astro`). Drafts: Continua / Anteprima / **Elimina** (wired
  the existing DELETE). Online: **Modifica** (→ `apri-modifica` → editor) /
  Guardalo online / **Metti offline**. Offline = `articolo.ts` `ritira` flips
  `draft: true` on **both twins** and commits (build drops it from the collection,
  so page + index + hreflang vanish together — no dangling hreflang); `ripristina`
  flips it back. Stale "publish button not finished" note removed.
- **Gutenberg inline formatting.** Added `_italic_` → `<em>` to `inline()` and
  `inlineHtml()` in lockstep, gated on a shared `isEmphasisBoundary` (CommonMark's
  no-intraword-underscore rule) so the emitted markdown is something **remark
  actually emphasises** — verified byte-identical to the published page (incl.
  `dall'_alba_` yes, `re_almente_` literal). Toolbar is now Grassetto / **Corsivo**
  / **Collega** (general `https://`) / Tour, on **every** text block incl. headings
  and lists, with `pointerdown` preventDefault so a tap doesn't blur away the
  selection it wraps.
- **Styled blocks + live preview.** Block textareas now echo the output (h2 big,
  quote indented italic). New **"Scrivi ↔ Vedi com'è"** toggle renders the article
  client-side via `blocksToPreviewHtml` (pure fn, no KV write). Extracted the
  duplicated `.article-body` CSS into one shared `src/styles/article-body.css` used
  by `BlogPostPage`, `anteprima`, **and** the live preview — the three can no
  longer drift.

**Verified.** `astro check` 0 errors · full `npm run build` green (verify-build:
no prerendered `/admin`, no client PII) · a bundled round-trip test — synthetic
blocks + **all 5 seed articles** parse idempotently (`blocks→md→blocks` stable) ·
italic parity **byte-identical** to remark's real output · runtime walkthrough
under `wrangler dev` with a minted dev session (no password used): dashboard shows
the new actions, **Modifica** on Rocinha parsed it back into a fully populated
editor (title, summary, `pub:tour-rocinha` cover, 10 blocks, photo alt text,
"Aggiorna"), and the live preview rendered `p/h2/img/blockquote/ul/strong/a`. New
API routes return the middleware's 401 JSON unauthenticated (registered + guarded).
`ritira`/`foto-pubblicata` need `GITHUB_TOKEN`, so their happy path is deploy-only.
`wrangler.jsonc` gained a `GITHUB_REPO` **var** (adapter auto-syncs the public env
var on build). Not pushed (push = deploy).

## 2026-07-31 (later still) — Tour galleries: vertical sticky deck → horizontal swipe deck

Client asked for the per-tour photo gallery to stop being an infinite vertical
scroll and become **a deck of cards flipped horizontally** — one photo stacked on
top of the next, swiped through like a physical pile.

Rebuilt `TourGallery.astro` + `deck.ts` around the site's **dual-form contract**
(one markup tree, two presentations — same discipline as the marquees' `.is-js`):

- **Static / no-JS / reduced-motion / failed-init:** a horizontal CSS
  **scroll-snap strip** — cards side by side, swipe or scroll sideways, captions
  visible, fully keyboard-reachable, zero JS. This is the readable baseline.
- **JS-live:** `deck.ts` adds `.is-live` to the section **as its last step**, and
  only then does CSS restyle those exact nodes into an **absolute pile** — front
  card + a peek of the two behind (scale/offset/rotate + a dimming shade), lifted
  with a soft shadow. A throw before `.is-live` leaves the strip intact; a failed
  init is a strip, never a stranded pile.

Interaction: **drag/fling** the top card either way → next (GSAP `Draggable` +
`InertiaPlugin`, both already free in 3.15); **‹ ›** buttons; **←/→/Home/End**
keys on the focusable `role="group"` stage; a live `aria-live` "Foto N di T"
status; progress **dots**; a mono live counter. The deck **loops** (past the last
wraps to the first, and backward from the first wraps to the last). Captions hide
in the pile — the counter/dots carry position.

**No ScrollTrigger** (unlike the old vertical deck) → the sticky-rect measurement
caveat is gone entirely. Height is `clientWidth × 0.75` (4:3) via a
**ResizeObserver**, so it's correct even when first measured in a hidden pane.
Initial/instant layout uses `gsap.set` (synchronous) not zero-duration `gsap.to`,
so the first paint is already the laid-out pile — no seeded-hidden flash. Motion
budget respected: transform/opacity only; `onDrag` writes, never reads layout.

i18n: added `galleryPrev` / `galleryNext` / `galleryPosition` (a `%c`/`%t`
template, rendered in Astro and re-templated in TS via `data-status-tpl`) /
`galleryHint` to **both** `it.ts` and `en.ts`.

**Verified:** `astro check` 0 errors · full `npm run build` green (Draggable +
InertiaPlugin bundle, verify-build gates pass) · static strip confirmed with JS
off · live state machine driven by hand through the frozen-ticker preview —
next / prev / backward loop-wrap / dot `goTo` / ArrowRight all keep counter, front
card and active dot in sync. Not visually screenshotable (preview pane runs
hidden), so peek offsets / shadow / drag physics are code-reasoned, not pixel-seen.
Not pushed (push = deploy).

**Adversarial review — 28 agents (4 dimensions × double-verify), 0 errors.** Two
findings survived; both were real a11y bugs I'd introduced and both are now fixed:

- **`aria-hidden="true"` on `.deck-nav`** wrapped the focusable ‹ › buttons — in
  the live pile that's a WCAG 4.1.2 "aria-hidden-focus" trap (keyboard/SR user
  tabs onto controls the tree announces as empty). Removed it; `display:none`
  already keeps them out of the static form. *Verified:* buttons now expose their
  `aria-label`s, no aria-hidden ancestor.
- **The static/reduced-motion strip had no keyboard-focusable scroller** —
  keyboard-only users couldn't reach photos 2…N (WCAG 2.1.1). Gave `.deck-track`
  `tabindex="0"` + `aria-label`; it's now the single keyboard entry in both forms
  (its keydown bubbles to the pile handler in live mode), so the stage's JS
  `tabIndex` was dropped. *Verified:* track focusable, ArrowRight from it still
  advances the pile.

Also folded in a rejected-but-fair note: `onDrag` no longer reads layout —
the drag threshold is sampled once on press. Everything else the review raised
(`overflow:hidden` on the frame, `is-live` ordering, the ~80 ms `busy` release,
`will-change`) was double-refuted as a non-defect. Re-checked: `astro check` 0,
full build green.

## 2026-07-31 (later) — Stage 3 could never have worked · stages 4 and 5 built

### 🔴 The photo upload was 100% broken in production, and every local test passed

`String.fromCharCode(...)` + `btoa` on a 400 KB photo costs **30 ms of CPU in
workerd**, against the free plan's **10 ms** per request. Every upload would have
returned error 1102. `wrangler dev` does not enforce the limit, which is why it
looked perfect — **the identical trap PBKDF2-at-100k fell into on the login.**
Fixed with the runtime's native `Uint8Array.toBase64()`: **1 ms**, byte-identical
output, confirmed *inside workerd* (`hasToB64: true, nativeMs: 1, legacyMs: 30`).
Had the iPhone test run first, all of it would have failed with an English
Cloudflare error page.

### Stage 3 verified for real, in a browser, on 24 MP originals

Previously only simulated with sharp. Now: EXIF rotation matches `sharp.rotate()`
at **3.31** mean pixel difference (every wrong orientation scores 71–76); the KV
round-trip reads back `exif: 0, xmp: 0, orientation: null`; base64 is byte-exact
(408 399 in, 408 399 out); uploads 201 with a live session. Still untested and
iPhone-only: **HEIC decoding**.

Ten defects found and fixed, the two worst being client-facing:

- **A dropped connection was reported as a broken photo** — *"Non riesco ad
  aprire questa foto. Provane un'altra."* Poor signal in Rio is the likeliest
  failure of all, and the message sent him hunting through his camera roll.
- **An expired session rendered the raw reason code `non-autenticato`**, beside a
  thumbnail that made it look saved.

Also: every uploaded photo was unreachable (id discarded, no index, draft id
regenerated per page load → a reload orphaned everything for 30 days) · a 60×40
image uploaded as "Pronta" · `larghezza=-99999&altezza=1e9` stored verbatim (now
read from the JPEG's own SOF marker) · any session could write into any draft ·
the 24 MP bitmap leaked on every throw path · the quality search did 4 encodes
and discarded 3 (now ≤3; the 9.7 MB photo went 6.4 s → 4.0 s **and** kept
1218×1600 instead of dropping to 975×1280).

### Adversarial review — 73 agents, 0 errors

Only 2 findings survived double refutation, both the base64 bug. The five stale
claims from last session were re-verified:

- **Rate-limiter KV exhaustion: REAL, high.** Worse than claimed — KV's 60 s read
  cache plus a non-atomic increment meant concurrent attempts all wrote the same
  value, and the `catch {}` swallowed the over-quota error, so it **failed open
  exactly when drained** while photo uploads and drafts stopped saving. → moved
  to the **Rate Limiting binding**: edge-local, zero KV writes, checked *before*
  PBKDF2, IPs folded to /64. Verified: blocks at 8/60 s, **0 `login-fail:` keys
  written**.
- **IPv6 bypass: partly real** — mechanically true, but brute force is refuted by
  the 62-bit passphrase; the real harm was the write drain, now gone.
- **`esci` GET: partly real** — cross-site `<img>` and link previews both refuted
  (SameSite-Lax blocks the cookie *write*), but a same-site prefetch survives →
  gated on Sec-Fetch metadata.
- **Cache-Control: partly real** → `no-store, private` on the whole admin area,
  set beside the guard so a new route cannot ship cacheable.
- **GitHub's 60-day cron: partly real but worse.** All three triggers shared ONE
  workflow file, so auto-disabling would have taken `push` down with it — silently
  killing stage 5's publish path during exactly the quiet period the project
  timeline predicts. `schedule:` removed (it is a no-op today anyway: no
  `BEHOLD_FEED_ID`).

Also fixed: **six EXIF-detection bypasses** (a single `0xFF` fill byte made a
GPS-bearing photo read clean — 18/18 assertions now pass) · Content-Length was
`Number(header ?? '0')`, so *omitting* it waved an unbounded body through · the
unauthenticated login POST parsed its body before any check.

### Two new build gates, both negative-tested

`npm run build` now fails if **anything under /admin was prerendered** — that is
a total auth bypass, since a prerendered page is served by the asset router in
front of the Worker and `src/middleware.ts` never runs — or if **client personal
data** appears in tracked source. And `npm run cf:deploy` refuses a build
carrying the placeholder origin: the config guard only fires under CI, and this
session's first local deploy was about to publish `https://vidapiena.workers.dev`
(a hostname nobody owns) into every canonical, hreflang and sitemap entry.

### ⚠️ Client data in the public repo

Francesco's mobile number was live in this file on `main`; redacted and pushed.
His business email is still reachable in history at `aa85a21` — a rewrite is a
force-push decision, deliberately deferred.

### Stage 4 — the block editor ✅

Seven block types and nothing else, so an article cannot render unstyled.
Textareas throughout (contenteditable fights the iOS keyboard); bold and tour
links wrap the selection and are re-parsed and escaped server-side.

**The preview is provably exact.** `BlogPostPage.astro` cannot render a draft
(`render()` needs a committed collection entry, and remark in the Worker would
eat the CPU budget), so the blocks render directly — and a build test drives the
same blocks down *both* paths and diffs them. The only divergence it found was
SmartyPants (`dall'alba` → `dall’alba`); with that mirrored the outputs are
**IDENTICAL** across all twelve blocks.

Autosave is **localStorage first, KV second** — 1,000 writes/day is shared with
everything else, so a save-on-timer would spend it in an afternoon and then fail
silently on the one feature whose job is not losing his work. KV gets a push once
a minute, on `pagehide` via `sendBeacon`, and on demand; a no-op save is refused
server-side. Verified: `L'alba: Rocinha dall'alto 🌅` round-trips and yields
`l-alba-rocinha-dall-alto`; unknown block kinds are dropped; oversized input is
clamped not rejected; `owner` is server-side; `../login-fail:1.2.3.4` as a draft
id gets a fresh one. Ownership 403s on every surface and leaks no text.

Plus the **in-app Italian help** and the **optional photo caption**
(figure/figcaption, keeps Astro's asset pipeline) — both Leo's 30/07 decisions.

### Stage 5 — the publish loop ✅ (token not yet wired)

Pre-flight validation → IT→EN via **Workers AI** (free, no second account) → **one
atomic commit** (blobs→tree→commit→ref, so the IT file, the EN twin and every
photo land together and trigger exactly one build) → honest progress → revert.

Photos go to GitHub as the base64 already in KV — no decode, no re-encode, which
is what keeps the commit inside the CPU budget. Phased so that **once the commit
lands, closing the phone is safe** and the screen says so. A translation failure
ships the Italian in the twin rather than stranding a half-publish: a missing EN
file is a live hreflang link to a 404, which is strictly worse.

Verified: an empty article, broken photo references, and a **duplicate of a real
published slug** are all caught with specific Italian messages; a valid article
passes; with no token the answer is an honest "not active yet, not your fault".

**Decisions taken with Leo:** fine-grained PAT scoped to this repo only
(Contents+Actions) — never a classic PAT, whose `repo` scope covers every
repository on the account · Workers AI to start, switchable.

**Not done:** the iPhone/HEIC test (Leo's, live now at `/admin/foto`) · the
`GITHUB_TOKEN` secret · merging to `main`.

## 2026-07-31 — DEPLOYED 🚀 + the review that caught a showstopper

**The site is live on Cloudflare Workers at <https://vidapiena.leonardo-rodo.workers.dev>** and
the back office works end-to-end: Leo logged in on a real phone and stayed logged in.

### 🔴 The back office was unreachable from every browser — and the test that hid it

`assets.not_found_handling: "404-page"` let Cloudflare's asset router answer *navigation*
requests itself. A request carrying `Sec-Fetch-Mode: navigate` that matched no static asset
got `dist/client/404.html` instead of falling through to the Worker — and there is no
`dist/client/admin`, so `/admin` and `/admin/entra` both returned the public 404. The Worker
never ran. **Nobody could ever have logged in.**

It passed verification last session because plain `curl` sends no navigation headers, and
without them the request *does* fall through and the login works perfectly. Any future check
of an on-demand route must use
`curl -H 'Sec-Fetch-Mode: navigate' -H 'Accept: text/html'`. Fixed with
`not_found_handling: "none"` — the Worker still renders the branded 404 with a real 404
status, so nothing is lost. ⚠️ **`run_worker_first: ["/admin/*"]` is NOT the fix**: once set,
anything not matching is handled by the asset router and never reaches the Worker, which
breaks the adapter's own prerender server (it POSTs to collect static paths; assets answer
POST with 405) and fails the **build**. Tried it, it failed, reverted.

### Other findings from the adversarial review (13 agents; 5 verifiers + the critic died on a usage limit, so ~50 raw claims remain UNVERIFIED and were not acted on)

- **Turnstile could not be activated as documented, and doing so locked the only user out.**
  The site key is `import.meta.env.PUBLIC_TURNSTILE_SITE_KEY`, inlined at *build* time, and
  `deploy.yml` never forwarded it (proved: `dist/server/chunks/entra_*.mjs` contained
  `const turnstileSiteKey = void 0;`). The secret is *runtime*, so setting it alone made every
  login fail `robot` against a form with no widget. Workflow now passes the variable;
  `missing-token`/`unreachable` get their own Italian message and no longer count toward the
  15-minute lockout, so a flaky Rio connection can't lock him out.
- **No session revocation.** `renewSession` rebuilt identity from the expiring token
  (`hash: ''` was the tell), so a session re-signed itself every ~65 days forever and rotating
  a password — the documented remedy — revoked nothing. The token now carries a truncated
  SHA-256 of the password hash and the guard re-checks membership against live `ADMIN_USERS`.
  **Verified**: rotating only the hash (same `SESSION_SECRET`, so the signature still
  verifies) kills the old cookie while the new passphrase logs in.
- **`SITE_ORIGIN`'s fallback is a hostname nobody owns** — Workers serve at
  `<worker>.<subdomain>.workers.dev`. CI now fails rather than ship it.
- **`robots.txt` + `llms.txt` shipped 9 dead absolute URLs**, live, from the first deploy —
  leftovers of the Pages era. `llms.txt` is the GEO/AI-citation surface, so this was silent
  and expensive. Both are now **generated from `SITE_ORIGIN`** (`src/pages/*.txt.ts`,
  prerendered), which also deletes them from the vidapiena.com cutover checklist.
- Lower severity, all fixed: `SESSION_SECRET` had no length floor (`importKey` accepts a
  1-byte HMAC key — a truncated paste was a silent downgrade) · the 100k PBKDF2 verify ceiling
  could only produce a 1102, never a login → 25k · `parseUsers` accepted a malformed hash, so a
  corrupt secret read as "wrong password" forever with **zero** log output · non-canonical
  base64url cookies verified identically (`token=`, `token%20`) → strict parsing, so future
  revocation can key on the cookie · `?errore=valueOf` rendered a function · a non-form POST
  500'd · **unauthenticated `/admin/api/*` returned a 302 to HTML that `fetch()` follows
  transparently — the stage 4/5 editor would have reported a successful save of an article
  that was never saved** → now 401 JSON.
- Checked and NOT a problem: Astro 7.1.3 defaults `security.checkOrigin: true`, so the CSRF
  origin check is live; `dist/server/.dev.vars` exists but `assets.directory` resolves to
  `../client`, so it is not in the published tree.

### Setup gotchas worth remembering

- The `workers.dev` subdomain is **not** offered until the first Worker exists — it was
  auto-assigned as `leonardo-rodo`. So `SITE_ORIGIN` cannot be set until after deploy #1,
  which means deploy #1 always bakes the placeholder. Deploy, then set it, then rebuild.
- **`wrangler secret put` must be run with the NAME only**, then the value pasted at the
  `Enter a secret value:` prompt. Passing the value positionally stores it as the *name* —
  which happened, putting `SESSION_SECRET`'s value where names are visible. Credentials were
  rotated. Deleting those malformed secrets is far easier in the dashboard than fighting
  PowerShell quoting over a JSON array.
- The Worker must exist before `wrangler secret put` (HOSTING.md had the order backwards).
- `admin-credentials.mjs` now takes **any number of `<email> <name>` pairs** and emits one
  `ADMIN_USERS` array and one `SESSION_SECRET`. Two runs produced two secrets and two arrays
  needing a hand-merge — the most breakable step in the setup, failing silently as "wrong
  password".

### Decisions taken with Leo

Analytics = **Cloudflare Web Analytics** + a "letto da N persone" figure inside `/admin` ·
Francesco-facing help = **in-app Italian help** inside the panel · photo captions = **build the
optional field now** (cheap during the block editor, expensive after) · **pt-BR still deferred**.
The first three override the approved plan's "explicitly out" list.

### Verified live

27 pages, IT+EN, tours, blog, article, 404 (real 404 status), sitemap (26 URLs, correct host,
`/admin` excluded), all 12 `llms.txt` URLs resolve 200. `/admin` 302s with
`X-Robots-Tag: noindex, nofollow` while public pages carry none. A wrong password gets the
Italian error and **no cookie**; an unknown email is byte-identical to a wrong password (no
enumeration); **no 1102**, so PBKDF2 at 20k fits the 10 ms free-plan CPU budget in production.

**Not done**: stages 3–5 (photo pipeline, block editor, publish loop). Turnstile deliberately
still OFF until Francesco has logged in once. Branch `cloudflare-migration`, **not pushed, not
merged** — `main` still points at GitHub Pages, and CI has never run this workflow.

## 2026-07-30 — Phase 3 begins: hosting moved to Cloudflare Workers ✅

- **Why**: the back office (`/admin`) that VISION §2 promised needs a server runtime — login, sessions, photo uploads, commits. GitHub Pages has none, so `output: 'static'` on Pages was a hard ceiling. Astro 7 is now maintained by Cloudflare (they acquired the team in Jan 2026) and `@astrojs/cloudflare` v14 targets Workers with KV-backed sessions on the free plan, so the host moved. Every public page is **still prerendered** — `output` stays `'static'`; only `/admin/*` sets `prerender = false`.
- **Decisions taken with Leo this session**: custom back office (not Decap/Sveltia/Keystatic — they all authenticate against GitHub and Francesco has no GitHub account) · whole site on Cloudflare Workers · the mandatory EN twin is **machine-translated at publish** · the editor is a **block editor**, Gutenberg-style, because that is both what "WordPress-like" means now and the most reliable thing on a mobile keyboard.
- **Installed**: `@astrojs/cloudflare@14.1.7` + `wrangler@4.115.0` (dev). `typescript` untouched at `^6` — 7.x still breaks `@astrojs/check`.
- **⚠️ `imageService: 'compile'` is mandatory** in the adapter options. The adapter's default changed to `'cloudflare-binding'`, which moves image transformation to **runtime Cloudflare Images** — a billable service and a different pipeline from the build-time AVIF/WebP derivatives sharp already produces. `'compile'` preserves the existing behaviour.
- **`base` is now `/`** (was `/vidapiena`). A Worker serves at the root of its hostname, and the adapter maps the assets directory onto `base` — a non-root base makes the served paths and the emitted asset URLs disagree. It also stopped the adapter writing a synthesized `wrangler.json` **inside** the served asset tree (`.assetsignore` only covers the assets root), which would have exposed it at `/vidapiena/wrangler.json`.
- **Origin de-duplicated**: `src/data/site.ts` now reads `import.meta.env.SITE` instead of repeating the origin, so `site` in `astro.config.mjs` is the single source. That config value reads `process.env.SITE_ORIGIN` — **`||`, not `??`**, because an unset GitHub Actions variable arrives as an empty string and `??` would let `site: ''` through and break the build. The vidapiena.com cutover is now: set the `SITE_ORIGIN` repo variable, and edit the absolute URLs in `public/robots.txt` + `public/llms.txt`.
- **Deploy**: `deploy.yml` keeps its triggers (push to `main`, `workflow_dispatch`, daily `cron '0 6 * * *'` for the Instagram refresh) and the `astro check` gate; the two Pages steps became one `npm run build` + `cloudflare/wrangler-action@v3` job. Deliberately **dropped `cancel-in-progress`**: a run started by the back office is publishing a real article and must not be cancelled half-way. Needs two new repo secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and optionally the `SITE_ORIGIN` variable.
- **`compatibility_date` is `2026-07-29`, not today**: the adapter prerenders *inside* the Workers runtime, so a date newer than the installed `workerd` binary supports fails the **build**, not just `wrangler dev`. Bump it only together with wrangler.
- **Verified** against the pre-migration baseline (27 pages / 594 `_astro` files): now **27 pages / 589 files**, fully explained — **−6** because the `<Picture>` `src` fallback is now deduped to reuse its 1200w `srcset` file instead of emitting a byte-identical twin (confirmed: `src` appears inside `srcset`), **+1** for the admin page's CSS chunk. All **553** HTML asset references resolve, **0** missing. Format counts identical (181 webp / 177 avif / 11 js / 3→4 css / 15 woff2). `astro check` → 0 errors. `wrangler deploy --dry-run` → 330 KB worker, 653 assets, bindings `env.SESSION` (KV) + `env.ASSETS`. On `wrangler dev`: every route 200, unknown path 404 via the real `404.astro`, `/admin` returns a **different timestamp per request** (genuinely on-demand), canonical + hreflang + sitemap on the new origin with no `/vidapiena` prefix anywhere, all **11** JS chunks serve 200 and `gsap@3.15.0` + `ScrollTrigger` import and apply a transform from the Worker.
### Stage 2 — the login (`/admin/entra`) ✅

- **Guard in `src/middleware.ts`**, not per page, so a new route under `/admin` cannot ship unprotected; it also sets `X-Robots-Tag: noindex` for the whole area. Verified the public site is untouched and gets no such header.
- **⚠️ The single hardest constraint here is CPU, not crypto choice.** The Workers *free* plan allows **10 ms of active CPU per invocation** and `crypto.subtle` counts against it. Measured: one PBKDF2-SHA-256 derive costs **~19 ms at 100,000 iterations** (workerd's hard cap), ~9 ms at 50,000, **~3.7 ms at 20,000**. The first implementation used 100,000 *because* it is the cap — it passed locally only because `wrangler dev` does not enforce the limit, and would have failed **every production login** with error 1102. Now **20,000**. This costs nothing: the strength is the **~62 bits of generated entropy**, not the hash cost. `verifyPassword` still accepts any stored count up to 100,000 so a differently-minted hash authenticates rather than reading as a wrong password, and the unknown-email decoy hash had to move to 20,000 too — left at 100,000 it would both blow the budget and make "unknown email" measurably slower than "wrong password", reintroducing the timing leak it exists to prevent.
- **`scripts/admin-credentials.mjs`** generates the passphrase, `ADMIN_USERS` and `SESSION_SECRET`, and writes nothing to disk. It is self-verifying: entropy is computed from the real word-list length, it **dies on a duplicate word**, and it **refuses to run below a 60-bit floor**. The first draft produced **31 bits** (5 words from a 72-word list) — fine online, but crackable in an afternoon offline if `ADMIN_USERS` leaked. Now 278 unique accent-free Italian words + a digit group = **62 bits**.
- **Session**: self-contained HMAC-signed cookie, not a KV record — the free plan allows 1,000 KV writes/day and a per-request write would be the first ceiling hit. One year, sliding renewal, HttpOnly + SameSite=Lax, `Secure` only over https (a Secure cookie on plain-HTTP localhost is dropped silently and looks exactly like a broken login).
- **Fails closed everywhere**: missing `SESSION_SECRET` or unparseable `ADMIN_USERS` → no users → nobody gets in, so a misconfigured deploy is a locked door not an open one.
- **Rate limit** in KV, written only on failures (10 per IP per 15 quiet minutes). Turnstile is wired but inactive until keys exist. Astro's CSRF origin check turned out to reject POSTs with no `Origin` header for free.
- **Verified on `wrangler dev`**: unauthenticated `/admin` redirects; wrong password sets no cookie and shows the Italian error; correct password issues the year-long cookie with the right attributes; the dashboard lists all 6 articles with the draft marked `Bozza`; **a flipped signature, a garbage token, an expired-but-validly-signed token and a payload swap reusing a valid signature are all rejected**; the limiter blocks on the 11th attempt (and then correctly blocked my own subsequent valid login — the fix was clearing local KV, not the code).

### Design review (13 agents) — what it changed

Ran after stages 1–2 were built. It voted **2–1 for the architecture we chose**, and most of what it flagged against the working tree was already fixed mid-session (`getKV`'s signature, the base-path asset layout). Four findings survived:

- **`updated` → `dateModified`** in the Article JSON-LD plus an "Aggiornato il" line. Flagged as un-retrofittable: the editor's whole purpose is revision, and without this an edit is indistinguishable from first publication to Google and AI crawlers, defeating the freshness half of the SEO/GEO strategy. Additive and optional, so the ten existing articles stay valid. Verified the IT article emits it and the EN twin without the field claims nothing.
- **In-app-browser warning on the login.** A link sent over WhatsApp opens in WhatsApp's WebView, which has its own cookie jar and no keychain access — he would log in there and appear permanently logged out in Safari, defeating the one-year session entirely.
- **`?email=` prefill + a real `mailto:` recovery link.** Typing an address exactly right on a phone is pure friction on a single-user portal, and a typo is deliberately indistinguishable from a wrong password.
- **`cacheDir` moved out of `node_modules` + an `actions/cache` step.** `npm ci` wipes `node_modules/.astro`, so CI was re-encoding all 545 derivatives every run — most of the 6–7 minute build Francesco waits through after tapping Pubblica.

Still open from the review, for the stages ahead: pt-BR is designed out of the data model while VISION requires it; no image captions; no analytics (VISION's own #1 risk is that he abandons the blog); nothing Francesco-facing exists on disk yet; blog index has no pagination; and `unlisted` cannot be excluded from the sitemap via the synchronous `filter` callback.

- **Not done yet**: **stages 3–5** — photo pipeline, block editor, publish loop. And nothing is deployed: that needs Leo's Cloudflare account and the two repo secrets. On branch `cloudflare-migration`, **not merged, not pushed**; `main` still deploys to GitHub Pages, so the fallback is intact.

## 2026-07-22 (later 4) — Type-check gate: the i18n contract is now enforced ✅

- **Why**: `en.ts` is typed against `it.ts` (`export const en: typeof it`), but `build` was plain `astro build` and neither `typescript` nor `@astrojs/check` was installed — a missing translation key only surfaced at prerender **if** that key happened to be called; a missing plain string shipped silently as `undefined`.
- **Fix**: installed `typescript@^6.0.3` + `@astrojs/check@^0.9.9` (dev). ⚠️ **`typescript` must stay on 6.x** — bare `npm i -D typescript` resolves to **7.0.2** (native compiler), which doesn't expose the programmatic API `astro check` needs (hard error at startup). Added `"check": "astro check"` and made `"build": "astro check && astro build"` — since `withastro/action@v3` in `deploy.yml` runs the package `build` script, CI is gated with no workflow change.
- **Also**: fixed the 8 `astro check` hints — `z` re-exported from `astro:content` is deprecated in Astro 7 → `content.config.ts` now imports `z` from `astro/zod` (Astro's own recommended replacement).
- **Verified**: `npm run check` → 0 errors / 0 warnings / 0 hints (72 files). Negative test: deleting `meta.ogAlt` from `en.ts` → exit 1, `ts(2741) Property 'ogAlt' is missing` (then restored). Full `npm run build` green end-to-end (check + 27 pages + sitemap). **NOT pushed.**

## 2026-07-22 (later 3) — Tour photo decks (every original on-page) + first 5 blog posts ✅

- **Why**: Leo asked for (a) **every** image from each tour's `media/` folder on its tour page as a stacked "deck of cards" — one card riding over the previous as you scroll — and (b) **5 short sample blog posts** in Francesco's voice with real photos, template-conforming so they migrate 1:1 to the phase-3 CMS back office.
- **Photos**: `photo-manifest.json` +29 entries (`rocinha-01…12`, `vidigal-01…15`, `tavares-01…05`, `giorno-01…09` — key = tour prefix + source file number, so every key traces to its original; already-processed originals keep their `zone-*`/`marquee-*`/`tour-*` keys, never re-encoded). `maxW` 2000, dropped to 1600 for the 20 dense shots; 46 photos, 21 MB total (some dense favela scenes still exceed the 400 KB advisory — source-only weight, browsers get AVIF/WebP). `tours.ts` galleryKeys now carry the full sets: rocinha 12, vidigal 16 (incl. formerly-orphaned `zone-2-lajes`), tavares 7, giorno 9 — hero `[0]` + deck order.
- **The deck** (`TourGallery.astro` rewrite + new `scripts/deck.ts`, registered in `main.ts`): dual-form per §4 — static/reduced-motion = plain 4/3 photo column with mono captions + "N fotografie"; `.motion-ok` = the **`li.deck-item`s themselves go sticky** (containing block = the `ol`, so each card pins at `nav+2.75rem` while the next rides over it — later siblings paint on top, no z-index), sticky deck-head with live `01 / NN` counter (`tabular-nums`, aria-hidden; static total swaps in via CSS). `deck.ts` scrubs only transform/opacity: covered card settles to `scale .94` + `.deck-shade` dims to `.3` (`trigger: next`, `top bottom→top 25%`), counter via per-item toggle at 55%. **Measurement caveat (review-caught)**: stuck sticky rects report pinned offsets, so `refreshInit`/`refresh` listeners un-stick items for every measurement pass + one corrective `refresh()` after creation — verified stable: `ScrollTrigger.refresh()` fired with 6 cards stuck leaves starts byte-identical. Cards have paper bg (covered captions can't ghost through); heights all viewport-derived (zero CLS, no stale triggers from lazy loads).
- **Blog**: 5 IT+EN pairs (same slug = hreflang pair — EN twin is **required**, BaseHead emits alternates unconditionally), `draft:false`, frontmatter = exactly the schema (CMS contract): `visitare-una-favela-e-sicuro` (22/07, flagship safety keyword) · `rocinha-come-visitarla` (15/07) · `vidigal-al-tramonto-come-arrivare` (08/07) · `tavares-bastos-la-favela-piu-tranquilla` (01/07) · `cosa-vedere-a-rio-in-un-giorno` (24/06). Template: Francesco first-person intro → H2s → blockquote in his voice → "I numeri" citable-facts list (GEO) → 2 inline images (`../../../assets/photos/<key>.jpg`, IT/EN alts; marquee alts reused from Community.astro) → relative CTA `../../tour/<slug>/` (verified resolving in both locales). **`cover` now renders**: post hero 16:9 (`BlogPostPage`, + og:image + Article JSON-LD image) and index thumbnails (`BlogIndexPage` 3-col row). `modello-articolo.md` documents cover/inline-image/link patterns for Francesco.
- **Ultra-review (13-agent workflow) confirmed 8 findings, all fixed**: sticky-rect measurement (above) · blanket `will-change` removed (was promoting up to 15 viewport-size layers) · 12px captions `ink/55→ink/65` (3.97:1→5.5:1 AA) · `galleryCount` n=1 pluralization · blog facts: "max 19 sempre"→"max 19–20" (Tavares is 20), community-fee overclaim for Tavares reworded, "auto privata"→"auto o van privato" per note tours (site's own giorno copy has the same imprecision — flagged as separate task, not touched here). Refuted: sunset-timing, a11y photo-count, one fact claim.
- **Verified**: `npm run build` green (27 pages, 545 image derivatives); dist deck counts 11/15/6/8 per tour ×2 locales; hreflang pairs + Article JSON-LD + og:image on all 10 posts; deck driven by hand in the preview (pane reports `prefers-reduced-motion: reduce` → motion gate correctly never boots there; forced `.motion-ok` + replicated init via `?vpdebug=1` GSAP): pin at 108px exact, mid-scrub interpolation, counter ticks, paint order, last-card full-scale, clean section exit. **NOT pushed** (push = deploy; Francesco should read the 5 IT posts first).
- **Note**: `.claude/launch.json` (parent, local) gained `vidapiena-preview-4322` — serves `dist/` on 4322 when another session holds 4321 (Astro dev is single-instance).

## 2026-07-22 (later 2) — Floating-island nav + hero fit + badge seal ✅

- **Why**: Leo disliked the top nav ("not modern"), and on opening the landing "didn't see everything" — the hero content was cramped against the bar and the circular badge was cut off on the right. Asked for a more modern/professional, **"spatial"** nav and a hero that fits one screen.
- **Diagnosis (measured at 1280×720, the hidden pane can't screenshot so geometry via `getBoundingClientRect`)**: the old full-width solid bar read generic/dated; the bottom-anchored headline block was **663px tall** in a 720 viewport, so its top (the eyebrow) sat at y=57 **under** the nav (ended y=65) — the collision Leo felt; the `h1` alone was **317px** because `clamp(…5.5rem)`+`max-w-[16ch]` wrapped line 1 into 3–4 lines; and `.vp-sticker` spanned y=648→**788** (68px below the fold) → bisected.
- **Nav → floating glass island** (`Nav.astro`, DESIGN.md §11): the bar became a frosted-ink **pill** (`radius 999px`, `backdrop-filter: blur(16px) saturate(1.15)`, hairline `paper/12` + a soft elevation shadow + one inset top highlight — depth, not glow) detached from every edge, centred, capped `75rem` (aligns to the `px-10` gutters at laptop widths, floats free wider). `.site-nav` is now the click-through frame (`0.75rem` top gap, `pointer-events:none`); only `.nav-island` catches events. The **`--nav-h` (4rem) contract is preserved** — `0.75rem` gap + `3.25rem` island = 4rem to the pill's bottom — so every anchor offset / drawer padding is unchanged. Three states verified: static/subpages/reduced-motion = solid `ink/0.68`; motion-path over the hero = light `ink/0.32`; scrolled-past-hero = condenses to `ink/0.68`. `@supports not (backdrop-filter)` → near-opaque fallback. `scripts/nav.ts` untouched (the overlay→solid flip and the `vp:intro-done` entrance animate `[data-nav]`, still correct).
- **Hero → fits one screen** (`Hero.astro`): `h1` re-sized to a clean **two lines** — `clamp(1.85rem,4.5vw,3.4rem)` + `max-w-[60rem]` (line 1 measures 696–745px per locale, well inside the 960px cap; dropped `max-w-[16ch]` + `text-balance`). Content now clears the nav with ~170px to spare at every width. Hero stays a full `100svh`, so the **intro→poster handoff contract (§5) is intact**.
- **Badge → fully-visible seal** (`Landing.astro`): lifted `.vp-sticker` (`top:-8.25rem` / `md:-11.75rem`) so the whole badge + its `-24%` orbit ring sit inside the hero's lower-right instead of being bisected by the fold. It's no longer a seam-straddle (impossible without shrinking the hero, which §5 forbids). **Hidden `<768px`** where the bottom-anchored headline fills the lower two-thirds and leaves no clear corner; the brand still rides in the nav + footer. DESIGN.md §6 + §12 amended.
- **Verified** across 375 / 768 / 1024 / 1280 (DOM geometry, not screenshots): headline is 2 lines at every width, eyebrow clears the island everywhere, badge fully in-view ≥768 (orbit bottom 706 ≤ 720) with **no** overlap of any content box, hidden `<768`, no horizontal overflow, **0 console errors**, subpage `solid` variant + PageHero clear the pill. Overlay `ink/0.32`↔`0.68` targets confirmed by toggling `.motion-ok`/`.is-scrolled` with transitions off (the frozen-clock pane leaves CSS transitions mid-interpolation otherwise).
- **NOT pushed** (push auto-deploys — Leo triggers). Untested live: the actual scroll-flip animation and the intro entrance, since the hidden pane freezes rAF/CSS clocks; the CSS mirrors the previously-working pattern.

## 2026-07-22 (later) — Logo fix + carousel hardening + the continuum redesign ✅

- **Why**: Leo reported (1) Viator+Airbnb badges broken sitewide, (2) the "A comunidade" animated carousel apparently deleted, (3) the official circular badge (`visual-references/new-logo.jpeg`) missing from the site, (4) the landing reading as stacked bands — asked for a seamless "spatial" continuum, stronger text/image contrast, and a more visible Italy↔Brazil palette.
- **Safety first**: the whole 22-page redesign was untracked → committed as baseline `be31aa8` before touching anything; one commit per phase since. **NOT pushed** — push auto-deploys via Actions; Leo triggers when ready.
- **Logo fix (root cause was never the files)**: all four marks valid; broken icons = stale cached HTML referencing hashed asset URLs another build no longer emits, plus `airbnb.svg` hashing differently local (CRLF) vs CI (LF) with no `.gitattributes`. Fixed: `.gitattributes` pins eol (airbnb.svg re-checked out LF, 3454B = the committed blob); new `OtaLogo.astro` inlines the 3 SVG marks at build time (inline SVG cannot 404) with viewBox-derived `aspect-ratio` reservation; Viator stays PNG. `platforms.ts` slimmed to `{key,name}`; Hero's duplicate import set removed. Users must hard-refresh once (Ctrl+F5).
- **Carousel**: never deleted — never committed, and fragile: all six inits shared one rAF callback, so any earlier throw stranded the marquee frozen in `.motion-ok` layout (reads exactly as "deleted"). Now: per-init try/catch in `main.ts` + inside `text-reveals.ts`; CSS `mq-drift` base loop under `.motion-ok` (server-rendered even sequence counts 2/2/4, duplicates `.mq-dupe` hidden statically) so the band **always** visibly scrolls; `marquees.ts` adopts the CSS position (`DOMMatrix.m41` → `.is-js`) for a seamless takeover. `?vpdebug=1` → `window.__vp` harness hook.
- **Official badge**: `BrandBadge.astro` (circle crop, 4% overscan → the yellow ring is the edge) — nav 34px every page, footer 56px, hero sticker 140/92px straddling the hero seam with a 35-char orbit textPath ring (rotates under `.motion-ok` only). JSON-LD `logo`/`image` → `icon-512.png`; `scripts/make-icons.mjs` regenerated favicon / apple-touch / icon-512 from the badge.
- **Continuum** (the descent 304m→0m returns as the page's spine — DESIGN.md §12): `.scrim-b` raised-floor scrim (hero) · zone washes `band-tint-*` (azzurro/verde/ouro, ≤13%) · FinalCta re-plumbed ink→notturno→ink · verde duotone at rest on community photos (lifts on hover with the grayscale) · rosso spray-stroke under "in italiano." + rosso stat dot (rosso points, never fills) · `MorroDivider.astro` stepped favela rooflines on both ink↔paper edges · Guide portrait straddles the seam (`md:-mt-24`) · `RouteMark.astro` descent rail with waypoints 304/180/120/60/0 (≥1440px, scrubbed in `spatial.ts`) · TrustBadges panelized (ink band, floating paper panel). No hard seams left on the landing.
- **Docs**: DESIGN.md amended (Forbidden gradients doctrine, §6 badge rules, new §12 continuum + marquee resilience).
- **Verified** (dist via `vidapiena-preview`, DOM/computed-style proofs — screenshots impossible in the hidden pane): 0 console errors · all assets 200, zero OTA-SVG requests (22 inline `<svg>` marks) · CSS drift deterministic (x = 0 → −535.33 → −1606 px at 0/8/24s of the 48s loop, via `getAnimations().currentTime`) · static path clean (dupes `display:none`, swipeable snap strip, wrapped words) · JS handoff: after manual init all 3 rows `is-js`, keyframe loop off, words row adopted at exactly −50% (−2989.31px) · rail scrub live (segments 1/0.42/0/0/0 mid-page under the manual `gsap.updateRoot` clock), curtain lifted · mobile 375px: sticker 92px, rail hidden, images 260px, no straddle · EN locale mirrors IT (localized orbit ring, "0 M · sea level"). **Caught & fixed in verification**: Astro's scoped `.mq-seq[data-astro-cid]` (0,2,0) outranked the global `.mq-dupe` hide rule by bundle order → static path showed doubled content; hide rule now `.mq-dupe.mq-dupe` (0,3,0).

## 2026-07-22 — Verified OTA deep-link rendering end-to-end ✅

- **Why**: Leo asked to connect the 4 tours to the real OTA booking links from `Context Knowledge/OTA-LINKS.md`. Inspection showed the wiring was **already complete on disk** — all 11 URLs match `src/data/tours.ts` `otaLinks` verbatim and are consumed by the cards, `TourBooking` and JSON-LD — so the task became a **rendering verification**, no code changes.
- **Method**: `npm run dev` (`vidapiena-dev`, :4321), then DOM extraction (`javascript_tool`) of every `a[rel~="sponsored"]` per surface. This is the reliable proof because the preview pane runs hidden — screenshots time out and the tours-grid reveal animation stays frozen, but the badge `href`s are in the DOM regardless of paint state.
- **Home tours grid**: 11 deep-link badges, grouped **2/3/2/4** (Rocinha · Vidigal · Tavares · Un Giorno), each with the exact expected URL, `rel="noopener noreferrer sponsored"`, `target="_blank"`.
- **4 tour detail pages** (`#prenota`): correct per-tour badges (2/3/2/4), all on the `hasLive` branch ("Prenota su una di queste piattaforme:"), **0** unlinked/"coming soon" spans.
- **Negative checks**: on `/` the only 11 deep links live inside `#tour`; the Hero mini-row + `TrustBadges` (8 marks) and the `/contatti/` trust row (4 marks) render **unlinked**, as intended. A missing platform renders no badge (never a placeholder).
- **EN locale**: `/en/tour/un-giorno-a-rio/` shows the same 4 deep links under English copy ("Book on one of these platforms:") — locale-invariant slugs + shared `otaLinks` confirmed.
- **Verified**: no dev-server build errors; **0** console errors on home + tour pages. Screenshot capture blocked by the hidden-pane compositing limit → the DOM-extracted `href` tables are the proof artifact.
- ⚠ **Left as-is (out of the "verify only" scope this session)**: the two `airbnb:` comments in `tours.ts` still read *"calendar closed / Sold out as of 21/07"*, whereas OTA-LINKS.md's 22/07 update says both listings are now bookable — comment-only, the links themselves are correct. Pre-existing open items unchanged (GYG €64 vs R$270; Civitatis IT-only badge on both locales).

## 2026-07-21 (later 4) — Multi-page redesign: nav + 4 tour pages + OTA booking, WhatsApp out 🧭

- **Why**: Leo reviewed the live one-pager and asked for a structural redesign — (1) the native white Windows scrollbar clashed with the ink page; (2) the tours had to be **all visible at once**, not a one-at-a-time fly-through; (3) **WhatsApp out** as booking channel: bookings go through the OTA platforms; (4) a **navigation menu + real pages** (blog, contact, the guide); (5) an **Instagram section** on the landing; (6) the 5-zone descent, the tagline and the sea-level CTA **removed** ("I like the idea, but I don't see the point"); (7) keep the 3D spatial feel. Decisions confirmed via 4 questions: grid all-visible · **4 tour detail pages now** (SEO) · descent removed entirely · real OTA deep links.
- **Site is now 22 pages** (was 3): `/` + `/tour/<4 slugs>/` + `/blog/` + `/la-guida/` + `/contatti/`, each ×IT/EN, + 404. Slugs are **locale-invariant** (only the `/en` prefix differs) so `@astrojs/sitemap`'s prefix-swapped hreflang alternates stay valid by construction.
- **Plumbing** (`i18n/index.ts`, `BaseHead`, `Base`, `LangSwitch`, `Footer`): new `pagePath(locale, path)` helper; one `path` prop threaded everywhere makes canonical/hreflang/og:url per-page and the **language switch land on the same page** instead of bouncing to the other homepage. `Base` grew `title/description/ogImage/nav` props + a `head` slot (JSON-LD moved out to per-page graphs); hero-poster preloads are landing-only.
- **Nav** (`Nav.astro` + `scripts/nav.ts`): fixed header on every page — wordmark, 5 links, LangSwitch, hamburger. Landing = `overlay` variant (transparent over the hero, turns solid past 60% of it via ScrollTrigger; **static path forces it solid from first paint** — the flip needs JS). Drawer: full-screen ink panel *under* the bar (bar stays usable), a11y state machine in an **ungated** component script (aria-expanded, Escape, scroll lock, focus moves), open/close choreography = pure CSS transitions staggered by `--i`, guarded by `prefers-reduced-motion`. On first visit the nav rides in on `vp:intro-done`. Footer carries the same 5 links (no-JS fallback + crawler path).
- **Tours grid** (`ToursGrid.astro` + `tours-grid.ts`, replacing `ToursDeck` + `tours-deck.ts`): all 4 cards in a 2-col grid (1-col mobile), natural height — **≈1900svh of scroll runway deleted** across deck+descent. What survives of the 3D: a once-only entrance (cards rise from `z:-420` with stagger; pre-hide in JS so a failed init can never blank the grid) and a ±3° `quickTo` hover tilt on fine pointers (rect cached on pointerenter — no layout reads per move). Card CTA → the tour's detail page; small per-card platform icons render only for live `otaLinks`.
- **Tour pages** (`components/tour/TourPage.astro` + `TourBooking` + `TourGallery` + `Breadcrumbs` + `pages/tour/[slug].astro` ×2): breadcrumb bar → photo hero (galleryKeys[0], eager/high — the page's LCP) → mono facts strip (durata·gruppo·lingue·prezzo) → narrative + highlights → gallery → practical `<dl>` + includes → prices (**tier table for Un Giorno a Rio**, tabular-nums) → booking section → sibling links. All copy in the dicts under `tourPage` (facts verified against `note tours.md`), full `TouristTrip` JSON-LD + `BreadcrumbList` per page; the landing `ItemList` slimmed to name+URL summaries pointing at the pages (Google's list→detail split).
- **OTA booking wired with the real links** from `Context Knowledge/OTA-LINKS.md` (collected earlier today): Viator 4/4 · GYG 4/4 · Airbnb 2 (Vidigal, Giorno — ⚠ calendars still "Sold out") · Civitatis 1 (Giorno — ⚠ per-group, Italian-only). Rendering per that doc's rules: per-tour badges show **only live platforms** (Rocinha/Tavares honestly show 2), `rel="noopener noreferrer sponsored"`, `target="_blank"`; the global `TrustBadges` marquee stays **unlinked**; marquee clones now also get `tabindex="-1"` (aria-hidden alone left cloned links tab-reachable). JSON-LD `sameAs` picks all 11 URLs up automatically.
- **WhatsApp fully removed** (dist grep = 0 hits): hero ghost → "Contatti", card buttons → detail pages, final CTA → tours + Instagram, `site.ts` number+helper deleted, `llms.txt` booking wording now platform-first + Instagram DM. Instagram is the one direct channel (contact page, booking fallback, footer, final CTA).
- **Removed**: `components/descent/` (4 files), `scripts/descent.ts`, `scripts/backdrop/` (the `FrameSequenceBackdrop`/M7 seam went with it — the 5-clip canvas-scrub plan is retired with the section), `data/zones.ts` (`ALTITUDE_TOP` inlined into `IntroLoader`, which keeps its 304→0 altimeter), `Tagline.astro`, dict blocks `descentIntro`/`zones`/`tagline`/`cta`. Zone photos stay as gallery/Instagram material — **except the AI-generated `zone-5-asfalto`, excluded from galleries and the Instagram band** (it would misrepresent as a real photo).
- **New landing order**: intro → hero → **tours grid** → community → guide (+ "La mia storia →" link) → **Instagram band** (6 real curated tiles + follow CTA — static, no embed script) → minimal final CTA ("Pronti a scoprire la vera Rio?") → trust badges → footer.
- **Scrollbar fixed**: `color-scheme: dark` + standard `scrollbar-color` (+ `::-webkit-scrollbar` for classic-scrollbar Safari) — no more white strip on ink; the page is also massively shorter, so the thumb reads sanely.
- **Blog scaffold**: content collection (`src/content.config.ts`, zod schema, `blog/<locale>/<slug>.md`, same slug = hreflang pair), index with an honest empty state ("Primi racconti in arrivo"), article layout with `Article` JSON-LD dormant until a post exists, one `draft: true` template file documents the format. **No invented content ships.**
- **New pages**: `/la-guida/` (bio + stat grid + portrait, `AboutPage`+`Person` JSON-LD) · `/contatti/` (Instagram DM primary, platform trust row, links to the 4 tour pages, logistics notes, `ContactPage` JSON-LD).
- **Verified**: `tsc --noEmit` + `npm run build` green at every phase boundary (17 HTML pages); dist grep for `wa.me|whatsapp` = zero; Phase-0 head diff = byte-identical baseline except the CSS hash. Full dist/browser verification pass follows in this session.
- ⚠ **Open**: Airbnb calendars closed (badges live but land on "Sold out" — drop the two `airbnb:` keys in `tours.ts` if Francesco won't open availability before launch) · Civitatis badge shows on both locales though the product is Italian-only (consider locale-gating later) · GYG favela price shows €64 vs R$270 catalog (unresolved upstream) · `giorno` min 2-vs-4 / max 15-vs-20 still unconfirmed (site ships the tier table's own bounds 2–15) · galleries are thin (2–4 photos) until a new `npm run photos` curation pass.

## 2026-07-21 (later 3) — OTA deep links collected 🔗 → `Context Knowledge/OTA-LINKS.md`

- **Why**: the site's per-tour platform badges need to deep-link each tour to *its own* booking page on each OTA, so a visitor books where they prefer. `src/data/tours.ts` shipped with four empty `otaLinks: {}` and a `TODO(Leo)` — this session closed the data gap.
- **Method**: read live from each supplier back office via Claude in Chrome (Leo already authenticated) — Airbnb Host listings, Viator Supplier Center, GetYourGuide Supply Partner, Civitatis Partners — then each public URL was opened and verified.
- **Result: 11 live booking links across the 4 tours.** Viator **4/4** (`5667099P1/P3/P4/P5`) · GetYourGuide **4/4** (`1358085 / 1356093 / 1358940 / 1375161`, all Bookable) · Airbnb **2/4** (Vidigal `7147633`, Un Giorno a Rio `7160484`) · Civitatis **1/4** (activity `54625`). Full matrix + copy-paste `otaLinks` block + badge/JSON-LD rendering notes in **`Context Knowledge/OTA-LINKS.md`** — deliberately kept **outside the repo** (it records platform approval states), so the tracked docs only reference it by name.
- **Findings worth acting on**: (a) both Airbnb listings are public but render **"No availability — Sold out"** → a badge linking there converts at zero, so open the calendar or ship without Airbnb badges; (b) Airbnb still `Declined` on Rocinha (×3) and Tavares Bastos (×2) → those two tours have no Airbnb link; (c) Civitatis carries only the full-day tour, sold **per group, Italian-only** — don't render it as a per-person price; (d) GetYourGuide shows the favela tours at **€64** vs the R$ 270 (≈€43) catalog target — verify what's configured; (e) **GYG "Un Giorno a Rio" (`1375161`) is now live** — it was last recorded as blocked on the insurance/EU attestations.
- **Next**: wire `otaLinks` into `tours.ts` + `TourCard.astro` (`rel="noopener noreferrer sponsored"`, `target="_blank"`), add the URLs to each tour's JSON-LD `sameAs`, and keep the WhatsApp fallback wherever a platform link is absent.

## 2026-07-21 (later 2) — Brazil–Italy re-theme + PROOF-grade motion layer + DESIGN.md

- **Why**: Leo brought the `PROOF/` reference site (a React + Framer Motion fashion site) and asked to port its feel — the opening video experience, the scroll-velocity "COMMUNITY" band, its text animations and spatial chrome — plus a proper design document and a colour system built on the actual Vidapiena idea: **Brazil + Italy**. PROOF is Framer Motion; we are GSAP, so nothing was copied — every effect was re-implemented on our own stack and gate.
- **Decisions taken with Leo** (3 questions): intro = **auto-playing loader**, not PROOF's click-gate (a booking site cannot put a door in front of ad traffic) · intro visual = the **existing spray-paint logo-reveal video** (already produced, on-brand, no new credits) · colour = **full re-theme**, not accents.
- **Palette (`global.css` `@theme`)** — the old dawn→dusk stops are gone. Both flags share **green**, so that is the bridge and the brand hue: `verde #0e7d3f` / `verde-scuro #0a5230`, Brazil's `ouro #f3c53d` (the working accent — buttons, focus, selection, active ticks) and `azzurro #2a66a4`, Italy's `rosso #bb2431` (rationed: dots and the loader playhead only), `notturno #14304a`, on a green-leaning `ink #10150f` and Italian ivory `paper #f7f3e8`. Contrast computed, not eyeballed — full matrix in DESIGN.md, incl. two hard bans (**ouro as text on paper = 1.47:1**, rosso small-on-ink = 3.00:1).
- **Zone grades remapped** (`zones.ts`): gold → sky → **green in the alleys** → red on the climb → dusk at sea level. The descent now tells both flags as one journey down.
- **The opening** (`IntroLoader.astro` + `intro.ts`): auto-plays once per session (`sessionStorage`), ~3s landscape / 2.5s portrait, skippable by click / tap / button / `Escape`. Logo video at `playbackRate = 2` (6.04s master → 3.02s) behind a vignette, **altimeter counting 304 → 0**, live **Rio ⇄ Roma clocks** (the Brazil–Italy duality, stated as instrumentation), red playhead sweeping a 220-tick ruler, then a `clip-path` curtain lifts onto the hero. Deliberately **outside** the motion gate — it must beat the idle boot — so it carries the same refusals inline and ships GSAP-free (~2KB, rAF only). `hero-video.ts` now stands down when `window.__vpIntroRan` (claimed at *start*, not end, because the idle boot lands mid-intro) so the reveal never plays twice; the poster it lifts onto is the video's own final frame.
- **Community band** (`Community.astro` + `marquees.ts`), placed between the descent and the guide: giant Portuguese words drifting right over a photo strip counter-flowing left, both boosted by scroll velocity. One shared `gsap.ticker` samples velocity per frame (`smoothed += (v - smoothed) * 0.12`, mapped 0–1200px/s → 0–6, **unclamped**) and drives every row; the boost is **magnitude-only**, so rows hurry but never reverse. Wrapping via `gsap.utils.wrap` over runtime clones, trailing gap held *inside* the sequence so the measured width is exactly the wrap distance and the seam never opens. Rows stop ticking off screen. Photos rest desaturated, resolve to colour over 1.6s on hover.
- **Badge strip is now a carousel** — same engine, third row, with an edge-fade mask. Trademark rules intact: **no filter is ever applied to a partner mark**, motion only translates the row.
- **Text layer** (`text-reveals.ts` + `motion-tokens.ts`): four `CustomEase` curves shared with CSS as `--ease-vp*` · masked per-character heading rises that **replay on re-entry** (SplitText `mask:'chars'`, `ignore:'.spray-stroke'` so the graffiti SVG is never split) · mono labels decode out of noise (ScrambleText) with `aria-label` pinned **before** the first glyph churns · `.link-sweep` directional underline · spray strokes paint themselves on (DrawSVG). Split runs after `document.fonts.ready`.
- **Spatial layer** (`HudCorners.astro` + `spatial.ts`): fixed corner furniture the page scrolls under, white in `mix-blend-mode: difference` so it inverts itself on ink and on paper; live dual clock that only ticks while visible; a ±5% parallax on the guide portrait inside a new clipping frame. Desktop only — phones already spend their corner budget on the altimeter.
- **Deliberate deviation from the brief**: tour-card photos were *not* given PROOF's greyscale-at-rest. Those photos are the product; desaturating them to reward a hover would cost bookings. They get a 1.04 push-in instead, and the greyscale device is spent where it is decorative — the community strip. Recorded as a rule in DESIGN.md.
- **`docs/DESIGN.md` (new)** — brand essence and the forbidden list, the palette with roles + measured contrast + the accent doctrine ("ouro works, rosso points, verde bridges"), type scale and the *mono = instrument* rule, the motion vocabulary and choreography, the motion-gate contract, the intro's poster/final-frame handoff contract, logo and spray-stroke usage, layout, components, a11y/i18n, and the photo privacy rule.
- **Photos**: 7 new marquee images curated off a contact sheet of the 36 unused originals → manifest → sharp pipeline. **Street art, mosaics and vistas only** — every group shot was rejected under the existing privacy checklist, so the band carries no identifiable guests. All under 400KB.
- **Verified**: IT + EN, 1440px and 390px · first visit plays the intro and suppresses the hero video (poster kept, seam-free); second visit in-session skips the intro and streams the hero video as before · scroll locked then restored · counter reaches 0, playhead 100% · masked reveals stagger and settle, `aria-label` preserved, spray strokes finish fully drawn (dasharray = full path length) · both community rows counter-flow, badge row idles while off screen · corner HUD blends and its clock ticks · no-JS/server HTML still ships readable headings, all 7 photos, all 4 badges, and the intro `hidden` · **production build: LCP 68ms, CLS 0, 0 console errors** — the loader-vs-LCP risk did not materialise (both videos were already `faststart`, moov at byte 36, so no re-encode was needed) · `npm run build` clean.
- ⚠ Unchanged: the 4 live OTA listing URLs are still missing, so badges remain non-links (`tours.ts` `otaLinks` empty). Pre-existing, untouched: the Bricolage preload console warning.

## 2026-07-21 (later) — Homepage rethink: tours-first hero + 3D tour deck

- **Why**: Leo's feedback on the live one-pager — a first-time visitor couldn't tell it was **a tour guide's site**, and the packages arrived far too late (4th section, after the hero + all five 150svh descent zones + the guide grid ≈ 10 screens before anything bookable). The old hero sold the *brand* (graffiti logo reveal + "La vista è solo l'inizio."); it never said what is for sale.
- **Direction chosen with Leo** (3 questions): keep the spray-paint logo video as the hero backdrop and fix the **text layer** · move the tours to **directly after the hero** · present them as a **depth fly-through** in 3D, flat grid kept as the fallback.
- **New page order**: hero → **tours** → descent → guide → tagline → CTA → trust badges → footer.
- **Hero** (`Hero.astro` + both dicts): explicit keyword-bearing H1 — *"Favela tour a Rio de Janeiro, **in italiano.**"* / *"Favela tours in Rio de Janeiro, with an Italian guide."* · sub now names Francesco, the 9 years, group size and price · kicker became the 4 product names · **two CTAs** ("Scopri i tour" → `#tour`, WhatsApp) · **mini OTA trust row** (same 4 logos/trademark rules as the bottom strip, on light chips, `fetchpriority=low` + intrinsic `width`/`height` so an above-the-fold reflow is impossible) · scroll cue reworded ("Scorri per esplorare") · decorative "304 m" removed from the hero. Poster/video/scrim untouched — **LCP element unchanged**.
- **The old poetic headline is not lost**: it now opens the descent as a short intro strip (`Descent.astro`), placed *outside* `#descent` on purpose — anything inside would skew the p→zone band math and the altimeter with it.
- **`ToursDeck.astro`** (replaces `Tours.astro`): one markup tree, two presentations — same trick as the zone figures. Default CSS = the readable 2-col grid (no-JS / reduced motion / Save-Data / 2G); `.motion-ok` turns those exact nodes into a 480svh (440 mobile) track with a `position: sticky` 100svh stage, `perspective` 1200/900px and `transform-style: preserve-3d`. `TourCard` reused unchanged.
- **`tours-deck.ts`**: the descent's own architecture — a paused timeline scrubbed by a proxy-`p` tween so every consumer reads the same eased progress, `gsap.matchMedia()` (desktop scrub 0.6 / mobile direct / reduced-motion registers nothing). One card per timeline unit: holds front for 65% of its unit, then accelerates past the camera while the next rises from z −1400, both landing exactly on the unit boundary. **`autoAlpha`, not opacity** — off-stage cards get `visibility: hidden`, so their WhatsApp buttons leave the tab order and the a11y tree. No blur/filters anywhere: depth is perspective scale + opacity only, which is what keeps it cheap on phones. Mobile gets the fly-through too (descent precedent), with shallower depth and no tilt.
- Both scrub sections are **CSS-sticky, never GSAP-pinned** → no pin-spacers, no start/end reconciliation; descent triggers are element-relative so the reorder can't disturb them. Also made `descent.ts`'s single `ScrollTrigger.refresh()` `readyState`-aware (idle boot can land after `load`, in which case the old listener would never have fired).
- **Verified** (dev server, IT + EN): DOM order · new H1/CTAs/badges · flat-grid fallback (the preview pane reports `prefers-reduced-motion: reduce`, so the static path got exercised for real — no `.motion-ok`, no GSAP) · 3D path driven through p = 0…1: exactly one card front at every sample (544px), exited cards at 888px = the z+460 scale, incoming at 251px = the z−1400 scale, counter/ticks flipping on each boundary, last card holding for a full beat · **focus test at mid-scroll: only the front card's button accepts focus, the other three refuse it** · `#tour` anchor lands exactly on the pin start · hero fits 375×667 with 67px clearance · no horizontal overflow · JSON-LD `@graph` + hreflang untouched, `#tour` deep links still valid · IT/EN dicts typecheck shape-identical (`tsc --noEmit`; note `astro check` needs an interactive install and can't run headless) · `npm run build` clean.
- ⚠ Unchanged from before: 4 live OTA listing URLs still missing (hero chips and bottom badges are both non-links) · WhatsApp number to confirm · "Un Giorno a Rio" max-pax conflict (15 vs 20). Optional follow-up: `TrustBadges.astro` logos have no intrinsic `width`/`height` either — same one-line CLS fix if a field measurement ever shows shift there.

## 2026-07-21 — One-pager BUILT & LIVE 🚀 (M0–M6)

- **The cinematic one-pager is live** at <https://leoitaly.github.io/vidapiena/> (IT) + `/en/` (EN) — GitHub Pages via Actions, auto-deploy on every push to `main`.
- **Decisions locked with Leo** (2 question rounds): scope = one-pager only · stack = **Astro (v7) + GSAP ScrollTrigger + Tailwind 4** · locales = **IT default + EN**, hreflang cluster · descent = **photo/gradient parallax now**, 5-clip canvas scrub post-renewal via a clean `BackdropRenderer` seam (`src/scripts/backdrop/`) · hero = existing logo-reveal video, poster-first · direction = premium base + graffiti accent (spray-stroke underline device), dawn→dusk palette · deploy = GH Pages.
- **Built**: hero (poster = LCP, video streams after, held final frame pixel-matches poster) · 5 sticky descent zones + fixed altimeter HUD 304m→0m (PT labels + locale gloss) · guide stat-grid · 4 tour cards (prices verified vs `note tours.md`) · tagline · "Meet me at sea level" CTA (WhatsApp prefilled per locale) · OTA trust-badge strip · footer. All content readable no-JS; reduced-motion/Save-Data/2G never load GSAP (~46KB gz idle-loaded otherwise).
- **Photos**: all 54 originals reviewed against a privacy checklist (agent pass; **zero high-risk picks used** — pure scenery + Francesco only; guest-consent note left for group shots). 9 curated → `scripts/photo-manifest.json` → sharp pipeline (EXIF/GPS stripped, mozjpeg). **Zone 5 (sea-level sunset with Dois Irmãos) didn't exist in the archive → generated with Nano Banana (2 cr, 5 left)**, source saved in `visual-references/exports/zone-5-asfalto-source.png`.
- **SEO/GEO**: per-locale meta/OG/Twitter/canonical/hreflang · JSON-LD `@graph` (TourOperator+LocalBusiness, WebSite, ItemList of 4 TouristTrip with BRL Offers) fed from `src/data/tours.ts` · `robots.txt` + `llms.txt` (semi-inert at subpath until custom domain) · sitemap with i18n alternates.
- **Perf (Lighthouse mobile, simulated slow-4G)**: **92 · CLS 0 · TBT 0ms · LCP 3.3s lab** (AVIF posters 96–108KB; real-device 4G expected < 2.5s — optional LQIP upgrade listed below).
- **Credits fact-check**: balance API says **7 → 5 credits** (100 trial granted 20/07, 103 spent on logo package) — the docs were right. The 5-clip shoot (~360–450 cr) needs the Plus renewal (~23 Jul).
- **⚠ Open data (TODOs in `src/data/`)**: 4 live OTA listing URLs (badges are non-links until then) · confirm the client's WhatsApp number for publication (kept in the local-only client profile — this repo is public) · "Un Giorno a Rio" max pax (site says 15, capacity row says 20) · guest consent if any group photo is ever used.
- **Next**: let Plus renew → 5-clip Seedance shoot → implement `FrameSequenceBackdrop` (M7, seam ready) · custom domain (one-commit switch documented in astro.config) · optional: LQIP poster placeholder, PSI field check after some traffic.

## 2026-07-20 (evening) — Logo animation COMPLETE ✅

- Leo activated the 3-day Plus trial (100 credits + 8 residual). Generated and verified the full logo-animation package: **16:9 hero reveal** (Seedance 2.0, 1080p, 6s) + **9:16 vertical** (1080×1920, 5s) + both wall-composite poster frames. All in `visual-references/exports/`, specs + job IDs + the working recipe in `LOGO-ANIMATION-BRIEF.md`.
- Verified frame-by-frame in the browser: bare wall → progressive spray-paint reveal → final frame pixel-matches the composite on both aspect ratios.
- Credits: 103 spent total, **7 left** — ⚠️ trial auto-renews to Plus €49/mo on ~23 Jul unless cancelled ("cancel auto-renewal" in a Higgsfield-connected chat). The 5-clip 3D-scroll shoot (~400–600 cr) needs the paid month anyway.
- Next: visual direction + hero prototype (Phase 1) — the intro video is ready to drop in.

## 2026-07-20 (later 2) — Platform trust-badge logos ✅ + hero video generated

- **Platform logos collected** into `visual-references/platform-logos/` (per Leo's request — "Vidapiena is on these platforms" badge section, desktop + mobile): Viator (official Partner Resources PNGs, 1000/480/300), Airbnb (official SVG + 800/400/200 PNGs), GetYourGuide (official SVG current + alt + 800/400/200 PNGs), Civitatis (official site SVG black + white PNG variant + 800/400/200 PNGs). Sources, usage and trademark caveats in the folder README. Documented in ASSETS-MAP + VISION (social-proof block).
- **Trial activated** (100 credits) → hero logo-reveal video generated: Seedance 2.0 std, 1080p, 16:9, 6s, `end_image` = wall composite (54 credits). Verification + 9:16 vertical: see next entry.

## 2026-07-20 (later) — Logo animation: composite ✅, video plan-gated ⛔

- Ran step 1 of the logo animation via Higgsfield MCP: logo imported (from the repo's raw GitHub URL) → **wall composite generated with Nano Banana Pro** (2 credits) — the exact "VIDA PIENA" wordmark spray-painted on a sunlit favela wall, high fidelity. Saved to `visual-references/exports/logo-wall-composite-16x9.png` (poster frame + `end_image` anchor for the reveal video).
- **Video generation blocked**: free Higgsfield plan can't run video jobs (`403 job_minimum_basic_plan_required`), independent of credits. Balance: 8 credits left of 10.
- Preflighted all costs (see LOGO-ANIMATION-BRIEF): hero 1080p 6s Seedance = 54 cr; full logo deliverable ≈ 125–180 cr; future 5-clip 3D-scroll shoot ≈ 400–600 cr → one Plus month (1,000 cr) covers both. Learned: 9:16 verticals should be **regenerated (54)**, not reframed (60).
- Reusable IDs saved in the brief (logo media_id, composite job_id). Next: Leo picks trial/Plus → run production generation.

## 2026-07-20 — Phase 0: environment & documentation ✅

- Created the repo boundary: **only `vidapiena-website/` is tracked** → [github.com/LeoItaly/vidapiena](https://github.com/LeoItaly/vidapiena) (parent project folder stays local — contains sensitive client data).
- Wrote the documentation set: `README.md`, `VISION.md` (product vision + SEO/GEO strategy + stack constraints + roadmap), `REFERENCES.md` (Hubert à Paris analysis, galleries, skills/MCP inventory), `ASSETS-MAP.md` (logos, `media/` photo folders, `Context Knowledge/` sources, public tour facts), `LOGO-ANIMATION-BRIEF.md` (Higgsfield spray-paint reveal — ready to run), `PROMPT-3D-SCROLL.md` (cinematic scroll site prompt, Vidapiena edition).
- Fetched and analyzed Francesco's content reference **hubertaparis.com** (Paris guide, 2CV tours) → borrow/do-better notes in `REFERENCES.md`.
- **Imported design skills** into `VidaPiena-Project/.claude/skills/` (outside repo): Anthropic `frontend-design` + GreenSock's 8 official GSAP skills (`gsap-scrolltrigger` et al.). Confirmed available in-environment: `ui-ux-pro-max`, `frontend-design-pro`, Higgsfield MCP, magic/21st.dev MCP, context7, browser tooling.
- Decisions recorded: stack **deliberately TBD** (bounded by prerendering/i18n/CWV constraints in VISION) · back office = phase 3 · booking via OTA links + WhatsApp for now.
- Next: **logo animation** (brief ready, needs go for credits) → visual direction → hero prototype.
