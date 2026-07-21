# Work Log

> Newest first. One entry per working session.

## 2026-07-21 — One-pager BUILT & LIVE 🚀 (M0–M6)

- **The cinematic one-pager is live** at <https://leoitaly.github.io/vidapiena/> (IT) + `/en/` (EN) — GitHub Pages via Actions, auto-deploy on every push to `main`.
- **Decisions locked with Leo** (2 question rounds): scope = one-pager only · stack = **Astro (v7) + GSAP ScrollTrigger + Tailwind 4** · locales = **IT default + EN**, hreflang cluster · descent = **photo/gradient parallax now**, 5-clip canvas scrub post-renewal via a clean `BackdropRenderer` seam (`src/scripts/backdrop/`) · hero = existing logo-reveal video, poster-first · direction = premium base + graffiti accent (spray-stroke underline device), dawn→dusk palette · deploy = GH Pages.
- **Built**: hero (poster = LCP, video streams after, held final frame pixel-matches poster) · 5 sticky descent zones + fixed altimeter HUD 304m→0m (PT labels + locale gloss) · guide stat-grid · 4 tour cards (prices verified vs `note tours.md`) · tagline · "Meet me at sea level" CTA (WhatsApp prefilled per locale) · OTA trust-badge strip · footer. All content readable no-JS; reduced-motion/Save-Data/2G never load GSAP (~46KB gz idle-loaded otherwise).
- **Photos**: all 54 originals reviewed against a privacy checklist (agent pass; **zero high-risk picks used** — pure scenery + Francesco only; guest-consent note left for group shots). 9 curated → `scripts/photo-manifest.json` → sharp pipeline (EXIF/GPS stripped, mozjpeg). **Zone 5 (sea-level sunset with Dois Irmãos) didn't exist in the archive → generated with Nano Banana (2 cr, 5 left)**, source saved in `visual-references/exports/zone-5-asfalto-source.png`.
- **SEO/GEO**: per-locale meta/OG/Twitter/canonical/hreflang · JSON-LD `@graph` (TourOperator+LocalBusiness, WebSite, ItemList of 4 TouristTrip with BRL Offers) fed from `src/data/tours.ts` · `robots.txt` + `llms.txt` (semi-inert at subpath until custom domain) · sitemap with i18n alternates.
- **Perf (Lighthouse mobile, simulated slow-4G)**: **92 · CLS 0 · TBT 0ms · LCP 3.3s lab** (AVIF posters 96–108KB; real-device 4G expected < 2.5s — optional LQIP upgrade listed below).
- **Credits fact-check**: balance API says **7 → 5 credits** (100 trial granted 20/07, 103 spent on logo package) — the docs were right. The 5-clip shoot (~360–450 cr) needs the Plus renewal (~23 Jul).
- **⚠ Open data (TODOs in `src/data/`)**: 4 live OTA listing URLs (badges are non-links until then) · confirm WhatsApp number `+55 21 98148-1718` for publication · "Un Giorno a Rio" max pax (site says 15, capacity row says 20) · guest consent if any group photo is ever used.
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
