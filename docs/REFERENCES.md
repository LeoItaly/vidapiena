# References & Inspiration

## 1. Primary content reference (requested by Francesco)

**Hubert à Paris — https://www.hubertaparis.com/**
Personal site of a Paris guide (art historian doing tours in a vintage Citroën 2CV). Analyzed 20 Jul 2026:

- **Structure**: Home · tour pages (3 signature tours) · Contact/Logistics · About. Bilingual FR/EN.
- **What works (borrow)**: one person = one brand (the guide IS the product) · few signature tours, not a catalog · strong personal story on the homepage ("art historian", Jean Cocteau quote → for us: the *vida piena* story) · direct contact (phone/email) · embedded Instagram as social proof · elegant, minimal, themed around his vehicle (2CV) → our equivalent theme: **graffiti/street-art × Rio sunset** (it's literally the logo and a tour stop).
- **What we'll do better**: no blog there (we need one for SEO/GEO) · no testimonials block (we have OTA reviews to surface) · no structured data / weak technical SEO (our core weapon) · no WhatsApp (essential for the Italian traveler) · tours have no prices on page (we show prices transparently).

## 2. Inspiration galleries (screenshots & award-level references)

| Source | URL | Use for |
| :--- | :--- | :--- |
| 🌐 Godly | https://godly.website | Astonishing hero/scroll interactions |
| 🏆 Awwwards | https://www.awwwards.com | The quality bar; search "travel", "tourism", "3D scroll" |
| 📘 Land-book | https://land-book.com | Landing page structure patterns |
| 🏀 Dribbble | https://dribbble.com | Visual style, color, type exploration |
| 📱 Mobbin | https://mobbin.com | **Mobile** patterns (half the product) |
| ✏️ CodePen | https://codepen.io | GSAP/canvas technique snippets |

Saved screenshots go in [`../visual-references/`](../visual-references/) — one subfolder per theme when they accumulate.

## 3. UI sniping (ready-made components to adapt)

| Source | URL | Notes |
| :--- | :--- | :--- |
| 🛒 21st.dev | https://21st.dev | Available **directly in this environment** via the `magic` MCP (component builder / inspiration / refiner + logo search) |
| 🪄 Magic UI | https://magicui.design | Animated marketing components |
| 🧩 shadcn/ui | https://ui.shadcn.com | Base component system if the stack goes React; also wired into the `ui-ux-pro-max` skill |

## 4. Design skills & MCP — inventory of this environment

**Imported into `VidaPiena-Project/.claude/skills/` on 20 Jul 2026** (kept *outside* the repo on purpose — third-party code, loaded automatically by Claude Code for this project):

- `frontend-design` — Anthropic's official frontend design skill (from [anthropics/skills](https://github.com/anthropics/skills))
- `gsap-core` · `gsap-timeline` · `gsap-scrolltrigger` · `gsap-plugins` · `gsap-utils` · `gsap-performance` · `gsap-react` · `gsap-frameworks` — GreenSock's official skills (from [greensock/gsap-skills](https://github.com/greensock/gsap-skills)). `gsap-scrolltrigger` is the engine of the 3D scroll concept.

**Already installed (most relevant for this project):**

- `ui-ux-pro-max` — styles/palettes/font-pairing intelligence ([nextlevelbuilder](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill))
- `frontend-design-pro` — production frontend + real photo sourcing (Unsplash/Pexels)
- `impeccable`, `taste-skill`, `gpt-tasteskill`, `soft-skill`, `emil-design-eng` — polish/quality enforcement (gpt-tasteskill also covers GSAP ScrollTrigger patterns)
- `3d-web-experience` — Three.js / R3F / WebGL guidance
- `image-to-code-skill`, `imagegen-frontend-web`, `imagegen-frontend-mobile` — design-image-first workflow
- `brandkit` — brand board generation (useful to formalize the graffiti × sunset identity)
- Curated list for more: [awesome-design-skills](https://github.com/bergside/awesome-design-skills)

**MCP servers connected:**

- **Higgsfield** — image/video generation (logo animation, Seedance clips for the 3D scroll). Core tools: `generate_image`, `generate_video`, `models_explore(action:'recommend')`, `media_upload`.
- **magic (21st.dev)** — component builder/inspiration/refiner, logo search.
- **context7** — live library docs (GSAP, framework of choice) when we start coding.
- **Claude Browser + playwright** — visual verification, screenshots, scroll testing.
- **github** — repo operations on [LeoItaly/vidapiena](https://github.com/LeoItaly/vidapiena).

## 5. Visual direction seed (from the logo, to be developed in Phase 1)

Two brand assets set the tone (see [ASSETS-MAP.md](ASSETS-MAP.md)):

- **Graffiti wordmark** (`Logo-Vidapiena.jpeg`): "VIDA" filled with the Brazilian flag, "PIENA" with the Italian tricolore, heavy black outline, sticker-style. → street-art DNA, ties directly to the graffiti-gallery stop on the Rocinha tour.
- **Round badge** (`new-logo.jpeg`): Francesco + golden-hour Rio panorama (Dois Irmãos / beach) + wordmark + banner "GUIDA ITALIANA A RIO", warm yellow ring. → the **sunset-gold palette** already used in the 3D scroll prompt.

Tension to resolve in Phase 1: raw graffiti energy vs. premium travel polish. Current bet: premium base (generous whitespace, editorial type, cinematic photography) with graffiti as the *accent* (logo, section markers, hand-painted details) — not a graffiti-themed site.
