# Platform logos — "Vidapiena is on…" trust badges

Official logos of the 4 OTA platforms where Vidapiena sells, for the website's social-proof / trust-badge section ("Book us on Viator · GetYourGuide · Airbnb · Civitatis") — desktop **and** mobile. Fetched 20 Jul 2026.

## Files

| Platform | Master | Raster sizes | Source |
| :--- | :--- | :--- | :--- |
| **Viator** | `viator/viator-logo-1000x252.png` (teal wordmark ®, transparent) | 1000 / 480 / 300 px wide | **Official Viator Partner Resources** (partnerresources.viator.com) — the sanctioned source for partner use |
| **Airbnb** | `airbnb/airbnb-logo.svg` (Bélo + wordmark, coral) | 800 / 400 / 200 px PNG | Wikimedia Commons (official brand SVG) |
| **GetYourGuide** | `getyourguide/getyourguide-logo.svg` (current stacked wordmark, orange) + `-alt.svg` (previous variant) | 800 / 400 / 200 px PNG | Wikimedia Commons (official brand SVG) |
| **Civitatis** | `civitatis/civitatis-logo-black.svg` (black wordmark) + `civitatis-logo-white-200x46.png` (white variant for dark backgrounds) | 800 / 400 / 200 px PNG (black) | **civitatis.com official site assets** (`/f/images/logos/`) |

## Usage notes

- **SVG masters cover every dimension** (web + mobile + retina). The PNG sets are fallbacks: 200 ≈ 1×, 400 ≈ 2×, 800 ≈ 3-4× of a typical ~150–200 px badge.
- **Dark sections** (the 3D-scroll site is dark): Civitatis has a ready white PNG; Airbnb/GYG/Viator white/mono variants can be derived from the SVG/transparent-PNG masters via fill swap or CSS filter at build time.
- Typical badge row: grayscale or single-tint logos at equal optical height (~24–32 px on mobile, ~32–48 px desktop), full color on hover.
- Each badge should deep-link to Vidapiena's live listing on that platform (also feeds SEO/GEO entity building via `sameAs`).

## ⚠️ Trademark note

These are third-party trademarks used referentially ("our tours are bookable on…"), which is standard for suppliers — but each platform has brand guidelines (min-size, clear space, no recoloring beyond approved variants, no implying endorsement). Before launch, sanity-check against: Viator Partner Resources brand page, Airbnb brand guidelines, GetYourGuide supplier/partner brand assets, Civitatis press kit. Swap in platform-provided "official partner" badges if available to suppliers.
