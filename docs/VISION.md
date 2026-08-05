# Vision — riovidapiena.com

> Domain bought 2026-08-03: **riovidapiena.com** (Cloudflare Registrar). The plain
> `vidapiena.com` was already squatted and `vidapiena.tours` cost $48/yr, so we took the
> on-brand `.com` modifier at wholesale (~$10/yr).

## One-liner

The personal website of an Italian guide in Rio: a cinematic scroll experience that *feels* like his tours, ranks for the searches Italian travelers actually type, gets cited by AI assistants, and lets Francesco publish blog posts himself in a couple of clicks.

## The two halves

### 1. Public frontend (Phase 1–2)

- **Visual-first**: 3D scroll storytelling (see [PROMPT-3D-SCROLL.md](PROMPT-3D-SCROLL.md)), GSAP-driven animations, animated graffiti logo intro (see [LOGO-ANIMATION-BRIEF.md](LOGO-ANIMATION-BRIEF.md)). The bar is Awwwards-level, not template-level.
- **Content**: 4 tour pages (Rocinha, Vidigal, Tavares Bastos, Un Giorno a Rio), About/Story (the "vida piena" narrative: Italian who chose Rio 9 years ago), Blog, Contact (WhatsApp-first), social proof (reviews + Instagram + **platform trust badges** — "Book us on Viator · GetYourGuide · Airbnb · Civitatis", official logos ready in `visual-references/platform-logos/`, each deep-linking to the live listing).
- **Booking**: no custom booking engine for now — deep-link to OTA listings (Viator / GetYourGuide / Civitatis / Airbnb) and WhatsApp direct. Direct booking is a later decision.
- **Mobile is not a variant, it's half the product.** Most travel research happens on phones. Every effect ships with a touch-friendly, battery-friendly version.

### 2. Back office (Phase 3)

- Simple **authentication portal** (email + password is enough) — Francesco only.
- Powered by a **headless CMS**: Francesco edits the lead/landing copy and publishes **blog articles (image + text)** in a simple editor. Zero markdown, zero git.
- **Decided 30 Jul 2026: a custom back office, not a headless CMS.** Every git-based
  candidate (Decap, Sveltia, Keystatic, Pages CMS, Tina) authenticates against a git
  provider — Francesco has no GitHub account, and none of them resize a 12 MB vertical
  HEIC, create the mandatory EN twin, or present an Italian UI. Sanity/Payload/Strapi/
  Directus were ruled out on recurring cost and on being a second content store next to
  the content collection the site already renders.
- Shipped instead: `/admin` inside this Astro app, on **Cloudflare Workers** (GitHub Pages
  has no server runtime, which is why the host moved), email + password with a one-year
  session, a Gutenberg-style block editor, and the EN twin machine-translated at publish.
  0 €/month. See [HOSTING.md](HOSTING.md) and the top entry of [UPDATES.md](UPDATES.md).

## Stack constraints (decision deferred — but bounded)

The user experience is "client-side" (rich, animated, app-like), **but pure client-side rendering is off the table for the public pages**: SEO and GEO require every tour page and article to be **prerendered HTML** (SSG or SSR) with full metadata, readable without JavaScript. Whatever stack we pick must deliver:

1. Static/prerendered HTML per route, with per-page `<title>`, meta description, OG/Twitter cards, canonical.
2. First-class i18n routing with `hreflang` (see language strategy below).
3. Room for heavy animation (GSAP + ScrollTrigger, canvas frame sequences, optional WebGL) **without wrecking Core Web Vitals** — effects lazy-load after LCP.
4. Headless CMS integration + rebuild webhook (a Francesco article publish must go live without Leo).
5. Image pipeline: responsive `srcset`, AVIF/WebP, lazy loading, CDN.

## SEO strategy (Google)

**Who searches, in what language:** Italian travelers planning Rio. Primary keyword language is **Italian**; English and Portuguese are secondary.

**Target keyword clusters** (seed list — validate volumes later):

- Transactional: `favela tour rio in italiano` · `tour favela rocinha` · `favela tour vidigal` · `guida italiana rio de janeiro` · `tour rio de janeiro in italiano` · `escursioni rio de janeiro italiano` · `cristo redentore pan di zucchero tour`
- Informational (blog fuel): `visitare una favela è sicuro?` · `cosa vedere a rio de janeiro in 3 giorni` · `rocinha come visitarla` · `quanto costa un favela tour` · `rio de janeiro quando andare` · `vidigal tramonto come arrivare`
- Brand: `vidapiena` · `vidapiena rio` · `francesco guida rio`

**Technical checklist (non-negotiable at launch):**

- [ ] Prerendered HTML for all public routes; content readable with JS disabled
- [ ] `robots.txt` + XML `sitemap.xml` (auto-generated, submitted to Search Console)
- [ ] Structured data (JSON-LD): `TouristTrip` per tour · `LocalBusiness`/`TourOperator` (with `sameAs` → Instagram + all 4 OTA listings) · `FAQPage` on FAQ sections · `Article` + `Person` (author Francesco) on blog posts · `BreadcrumbList`
- [ ] `hreflang` cluster per page (it / en / pt-BR + `x-default`)
- [ ] Core Web Vitals green on mobile: LCP < 2.5s, CLS < 0.1, INP < 200ms — **the 3D/video hero must degrade to a static poster on slow connections** (`prefers-reduced-motion` and connection-aware loading)
- [ ] Descriptive alt text on every image (they're also image-search entry points)
- [ ] Clean semantic HTML (one `h1`, logical heading tree, `<main>/<article>/<nav>`)
- [ ] Search Console + analytics (GA4 or privacy-light alternative — TBD) from day one

**Language strategy (open question for Francesco):** the OTA rule for this project is "descriptions in English, highlight the Italian native guide" — but for *his own site* the highest-intent audience searches in Italian. Proposal: **IT as primary locale, EN secondary, PT-BR later**. Confirm before content production.

## GEO strategy (AI search: ChatGPT, Perplexity, Gemini, Claude)

AI assistants are becoming the first "travel agent". The site must be the source they quote when someone asks *"is there an Italian-speaking favela tour in Rio?"*:

- **`llms.txt`** at root: concise, factual summary of who Francesco is, the 4 tours, prices, languages, meeting points, links.
- **Q&A-shaped content**: every tour page carries an FAQ block answering the real questions (Is it safe? Can I take photos? What's included? Where do we meet?) — the same block is `FAQPage` JSON-LD. Answers written as quotable, standalone facts.
- **Entity building**: consistent name + description everywhere; `sameAs` links binding the site ↔ Instagram ↔ Viator/GYG/Civitatis/Airbnb listings, so crawlers resolve "Vidapiena" as one entity.
- **Citable facts with numbers** ("3-hour small-group tour, max 19 people, R$270 per person, led in Italian by a native speaker who has lived in Rio for 9 years") — AI answers favor precise, attributable claims.
- **Freshness**: the blog gives the domain a heartbeat; stale sites fall out of AI answers.

## Performance vs. beauty — the ruling principle

The cinematic layer (logo video, scroll-scrubbed clips, WebGL) is **progressive enhancement**. The HTML underneath must be complete, fast and rankable on a mid-range Android on 4G. When beauty and LCP fight, LCP wins on first paint — beauty loads one breath later.

## Roadmap

| Phase | Deliverable | Status |
| :--- | :--- | :--- |
| **0** | Environment + documentation + repo | ✅ 20 Jul 2026 |
| **1** | Logo animation (Higgsfield) · visual direction · hero prototype | ✅ 21 Jul 2026 — went further: **full cinematic one-pager LIVE** (IT+EN) at leoitaly.github.io/vidapiena · stack decided: **Astro 7 + GSAP + Tailwind 4** · photo descent with `BackdropRenderer` seam for the clip scrub (see UPDATES 21/07) |
| **1b** | 5-clip Seedance shoot post Plus renewal (~23 Jul) → `FrameSequenceBackdrop` canvas scrub | |
| **2** | Full frontend: 4 tour pages, story, contact, SEO/GEO hardening (robots, sitemap, JSON-LD, llms.txt, hreflang — **one-pager already carries all of these**) | |
| **3** | Custom back office (auth, article editor) | ✅ 05 Aug 2026 — Cloudflare Workers hosting, `/admin` login, phone photo pipeline, block editor and publish loop all done; articles now come out SEO/GEO-ready from one dropdown (audited, see UPDATES 05/08) |
| **4** | Launch: domain, Search Console, analytics, redirects from link-in-bio | 🚧 domain **riovidapiena.com** live 03 Aug 2026; Search Console / Bing verification hooks in place (`PUBLIC_*_SITE_VERIFICATION` repo vars) — analytics + link-in-bio redirects remain |

## Open questions

- [x] Domain: **`riovidapiena.com`** bought 2026-08-03 on Cloudflare Registrar (Leo is registrant/payer; `vidapiena.com` was squatted, `.tours` was $48/yr).
- [ ] Language set at launch: IT+EN confirmed? PT-BR when?
- [ ] Booking: OTA deep-links + WhatsApp only, or direct booking later (Bokun widget could embed)?
- [ ] Analytics: GA4 vs privacy-light (Plausible/Umami)?
- [ ] Blog languages: Italian only at first?
