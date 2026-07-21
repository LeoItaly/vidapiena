# Assets Map — where everything lives

> The website repo is only `vidapiena-website/`. Source material sits in the **parent project folder** (`VidaPiena-Project/`, local only, never committed). Paths below are relative to the parent folder.

## ⚠️ Sensitive-data rule

`Context Knowledge/` contains personal and financial data (IDs, CPF/CNPJ, IBANs, `password.txt`, insurance policy). **Reference it, never copy it into this repo.** Anything that enters the repo must be publishable: this repo is public.

## In this repo

| Path | What |
| :--- | :--- |
| `visual-references/Logo-Vidapiena.jpeg` | **The logo to animate**: graffiti wordmark "VIDA PIENA" — VIDA = Brazilian flag fill, PIENA = Italian tricolore fill, black outline, white background |
| `visual-references/new-logo.jpeg` | Newer round badge (20 Jul 2026): Francesco portrait + golden-hour Rio panorama + wordmark + "GUIDA ITALIANA A RIO" banner, yellow ring — Instagram profile asset & palette reference |
| `visual-references/exports/logo-wall-composite-16x9.png` | Generated logo-on-favela-wall composite (poster frame + video `end_image` anchor) |
| `visual-references/exports/zone-5-asfalto-source.png` | Generated sea-level sunset (Dois Irmãos silhouette, Nano Banana 21/07) — zone-5 descent backdrop; no real beach photo exists in `media/` |
| `visual-references/platform-logos/` | **Official OTA logos** (Viator, Airbnb, GetYourGuide, Civitatis) as SVG masters + 200/400/800 PNG sets, for the "Vidapiena is on these platforms" trust-badge section — sources & trademark notes in its [README](../visual-references/platform-logos/README.md) |
| `visual-references/` | Drop future design screenshots/references here (subfolder per theme) |

## In the parent folder (local only)

### Photos — `media/`

Real tour photos, one folder per tour — **primary imagery for the website**:

| Folder | Content |
| :--- | :--- |
| `media/favela-tour-rocinha-vidapiena/` | Rocinha tour photos |
| `media/favela-tour-vidigal/` | Vidigal tour photos |
| `media/favela-tour-tavares-bastos/` | Tavares Bastos tour photos |
| `media/un-giorno-a-rio-vidapiena/` | Full-day city tour photos (Cristo, Santa Teresa, Selarón, Sugarloaf) |
| `media/foto-profilo-varie-opzioni-attuali-di-foto-a-rio/` | Profile photo options for About/hero |

Before web use: select → edit/crop → export responsive AVIF/WebP into the site's asset pipeline. Never hotlink originals.

### Written sources — `Context Knowledge/`

| File | Use for the website |
| :--- | :--- |
| `note tours.md` | **Operational source of truth** for the 4 tours: durations, capacity, prices, schedules, meeting points, official descriptions (Italian) — the raw material for tour pages |
| `Profilo Cliente Francesco Vidapiena.md` | Francesco's bio & the "vida piena" brand story (9 years in Rio) — About page + author entity for the blog. Also contains fiscal/payment data: **do not copy** |
| `WhatsApp Chat with Francesco Guida Rio.txt` | Raw voice & tone of Francesco — mine it for authentic copy phrasing ("scaldiamo i motori") |
| `Airbnb/Airbnb Experiences - Requisiti e Standard.md` (folder `Airbnb/`) | Airbnb listing standards — useful checklist for description quality on our own tour pages |

### Public tour facts (safe to publish — mirror of `note tours.md`, Jun 2026)

| Tour | Duration | Group | Price (retail) | Meeting point |
| :--- | :--- | :--- | :--- | :--- |
| Favela Tour Rocinha | 3h | max 19 | R$270 pp (child ≤12: R$180) | Av. Niemeyer 780, São Conrado |
| Favela Tour Vidigal | 2h30 | max 19 | R$270 pp | Praça do Vidigal |
| Favela Tour Tavares Bastos | 2h30 | max 20 | R$270 pp | Rua Bento Lisboa 72, Catete |
| Un Giorno a Rio (premium day) | 8–9h | 2–15 | from R$780 pp (tiered by group size) | Hotel pick-up anywhere in Rio |

Common facts: tours in **Italian, English, Portuguese** (no German) · min 2 pax · favela tours include mototaxi ride + community visitation fee · drone video optional extra · Instagram [@vidapiena](https://www.instagram.com/vidapiena/).

> Prices are the guide's current published prices (also on the OTAs) — re-verify against `note tours.md` before building pricing UI.
