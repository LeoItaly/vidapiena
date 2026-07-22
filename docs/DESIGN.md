# DESIGN.md — the Vidapiena design system

The rules this site is built on. When something here disagrees with the code, the
code is the bug.

Companion docs: [VISION.md](VISION.md) (product, SEO, constraints) ·
[ASSETS-MAP.md](ASSETS-MAP.md) (where the media lives) ·
[REFERENCES.md](REFERENCES.md) (inspiration set).

---

## 1. Brand essence

**Vidapiena is Brazil and Italy in one person.** Francesco is Italian, carioca by
adoption for nine years, guiding small groups down through Rio's favelas in
Italian, English and Portuguese. The site has to feel like both countries at once
without ever looking like a flag pin.

The line the whole design serves: *everyone photographs Rio from above — with me
you walk down through the life inside it.* Hence the descent: 304 m to 0 m, the
spine of the page.

**Voice.** Working language Italian, published copy per locale, and the zone
labels stay in **Portuguese** (`O Mirante`, `As Lajes`, `Os Becos`, `A Ladeira`,
`O Asfalto`) in both locales. Portuguese is brand voice, not content — it is
never translated. The community band's giant words (`Comunidade`, `Vida Piena`)
follow the same rule.

**Graffiti is product, not decoration.** The logo is a real spray piece on a real
wall. The site gets exactly *one* graffiti device beyond the logo — the sprayed
underline (`SprayStroke.astro`). Everything else stays typographic and precise,
which is what makes the one graffiti moment land.

### Forbidden

- Flag salad. Never render either flag literally outside the logo artwork.
- More than one saturated hue per section band.
- Recolouring, filtering or greyscaling partner logos (Viator, GetYourGuide, Airbnb, Civitatis).
- Neon, glow, or gradients as decoration. Sanctioned gradients are exactly:
  legibility scrims (`.scrim-b`, the intro vignette), the FinalCta dusk dip,
  and the low-opacity zone washes (`band-tint-*` — §12).
- Greyscale-at-rest on tour photos. Those photos are the product (the community
  strip is different — see §2).
- Any animated presentation without a static fallback (§4).

---

## 2. Colour

Both flags share **green**. That is the bridge, and it is the brand hue. Brazil
adds gold and blue; Italy adds red and the warm ivory. Neutrals carry ≥85% of
every viewport — the colour arrives in small, deliberate amounts.

Tokens live in the `@theme` block of `src/styles/global.css`.

| Token | Hex | Role |
|---|---|---|
| `--color-verde` | `#0e7d3f` | The bridge green — sits between IT `#008C45` and BR `#009739`. Section strokes, the community zone. |
| `--color-verde-scuro` | `#0a5230` | Small text and borders on light surfaces. |
| `--color-ouro` | `#f3c53d` | Brazilian gold. **The working accent**: primary buttons, focus rings, selection, active HUD ticks, the marquee chip. |
| `--color-azzurro` | `#2a66a4` | Brazilian flag blue, Italian name (*gli Azzurri*) — the bridge said the other way round. |
| `--color-rosso` | `#bb2431` | Italian red. **Rationed**: signal dots, the loader playhead. It points; it never fills. |
| `--color-notturno` | `#14304a` | Guanabara dusk — the floor of the descent, the CTA ground. |
| `--color-ink` | `#10150f` | Page ground. A green-leaning black, not a neutral one. |
| `--color-ink-soft` | `#2e3a2b` | Body text on light surfaces. |
| `--color-paper` | `#f7f3e8` | The Italian warm ivory. |
| `--color-paper-dim` | `#ece6d3` | Alternate light surface. |

### Accent doctrine

> **Ouro works. Rosso points. Verde bridges.**

Gold is the only accent allowed to carry an interface job (buttons, focus,
active states). Red is a pointer — a live dot, a playhead — never a surface or a
button. Green connects: it is what both countries have, so it belongs to the
community, the guide, and the section strokes.

### Contrast (measured, sRGB)

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `ink` | `paper` | 16.67 | AAA |
| `ink-soft` | `paper` | 10.78 | AAA |
| `verde-scuro` | `paper` | 8.37 | AAA |
| `rosso` | `paper` | 5.55 | AA |
| `azzurro` | `paper` | 5.36 | AA |
| `verde` | `paper` | 4.71 | AA — prefer large/bold |
| `paper` | `ink` | 16.67 | AAA |
| `ouro` | `ink` | 11.32 | AAA |
| `paper` | `notturno` | 12.21 | AAA |
| `ouro` | `notturno` | 8.29 | AAA |
| `ink` | `ouro` | 11.32 | AAA (the primary button) |

**Two hard bans:**

1. **`ouro` as text on `paper` = 1.47. Never.** Gold on light is decorative only
   (a stroke, a rule, a chip) — never a glyph you are expected to read.
2. **`rosso` on `ink` = 3.00.** Large or decorative only. No small red text on
   the dark ground.

### The descent grade

Each zone drives a colour grade through `gradeVar` in `src/data/zones.ts`. The
sequence tells the two flags as one journey down the hill:

| Zone | Alt | Token | Why |
|---|---|---|---|
| `mirante` | 304 m | `ouro` | Sunrise gold at the lookout. |
| `lajes` | 230 m | `azzurro` | Open sky over the rooftops. |
| `becos` | 150 m | `verde` | The shared green, in the alleys where the community actually lives. |
| `ladeira` | 70 m | `rosso` | Mototaxi engines — the loud part. |
| `asfalto` | 0 m | `notturno` | Dusk over the bay, where the tours start. |

Grades are used as low-opacity scrims and HUD ticks. They never become text
colours.

---

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| Display | **Bricolage Grotesque Variable** | Headlines, the giant marquee words, the altimeter readout. The only preloaded face. |
| Body | **Instrument Sans Variable** | Paragraphs, buttons, card copy. |
| Mono | **IBM Plex Mono** | Every instrument: eyebrows, HUD, clocks, counters, prices, the ruler. |

**The rule that holds it together: mono means instrument.** If a piece of text is
a reading, a label, a coordinate or a count, it is mono, uppercase, and tracked
wide. If it is something a human said, it is sans or display.

Scale as built:

| Element | Size |
|---|---|
| Hero `h1` | `clamp(2.1rem, 7vw, 5.5rem)` / line-height `1.02` |
| Section `h2` | `text-3xl`–`text-4xl`, `md:text-5xl`–`text-6xl` |
| Marquee word | `clamp(100px, 15vw, 230px)` / `0.86` / tracking `-0.04em` |
| Altimeter (intro) | `clamp(2.4rem, 4.4vw, 4.2rem)`, weight 300 |
| Body | `0.95rem`, `md:text-lg`, line-height `relaxed` |
| `.eyebrow` | `0.72rem`, uppercase, tracking `0.2em`, mono |
| Corner HUD | `0.6rem`, uppercase, tracking `0.28em`, mono |

**Every number that can change while you watch it gets `tabular-nums`** — the
altimeter, the clocks, the deck counter, prices. Digits must not dance.

---

## 4. Motion

### The four curves

Registered as GSAP `CustomEase` ids in `src/scripts/motion-tokens.ts` and mirrored
as `--ease-vp*` custom properties in `global.css`, so a CSS hover and a scrubbed
tween move identically.

| Name / CSS var | Bezier | Used for |
|---|---|---|
| `vp` / `--ease-vp` | `0.65, 0, 0.35, 1` | Decisive moves, hover feedback, the underline sweep. |
| `vpOut` / `--ease-vp-out` | `0.22, 1, 0.36, 1` | Reveals. Text rising, images scaling. |
| `vpExpo` / `--ease-vp-expo` | `0.16, 1, 0.3, 1` | Hero-scale settles. Use sparingly. |
| `vpInOut` / `--ease-vp-in-out` | `0.76, 0, 0.24, 1` | Heavy transitions: curtains, the intro lift. |

Durations: `micro 0.2s` · `reveal 0.8s` · `curtain 1s` · `drift 1.8s`.
Character stagger: `0.035s`.

### Choreography

- **Headings rise out of a mask**, one character at a time, and **replay** each
  time they re-enter the viewport. `[data-reveal-heading]`.
- **Mono labels decode** out of noise, once, on arrival. `[data-scramble]`.
  Links re-decode on hover. `[data-scramble-hover]`.
- **Sections open with a curtain** — a scaleY wipe from the top, once.
- **Strokes paint themselves** — DrawSVG, once. `[data-spray]`.
- **Marquees never reverse.** The scroll-velocity boost is magnitude-only: rows
  hurry when you scroll, settle to their idle drift when you stop, and hold their
  direction no matter which way you go.
- **Colour is a reward.** The community strip rests desaturated and resolves to
  full colour over ~1.6s on hover. Nowhere else.

### The motion gate (non-negotiable)

`src/scripts/main.ts` is the only script on every page view. It loads **nothing**
for visitors with `prefers-reduced-motion`, Save-Data, or a 2G connection; for
everyone else it idle-imports the animation modules and adds `.motion-ok` to
`<html>`.

**Every animated presentation must therefore have a complete static form.** The
pattern is one markup tree, two presentations: default CSS renders something
readable and useful, and `.motion-ok` restyles those exact nodes. The descent
zones, the tour deck, the community strip and the badge row all work this way.
Nothing may hide text before JavaScript runs.

The one exception is the opening overlay, which must appear before the idle boot.
It carries the same refusals inline and runs GSAP-free.

### Budget

Transform and opacity only. Frame callbacks write, never read layout
(`gsap.quickSetter`, direct `textContent`). Off-screen rows stop ticking.
Frame deltas are clamped so a backgrounded tab cannot teleport anything.

---

## 5. The opening

Auto-plays once per session (`sessionStorage: vp-intro`), ~3s landscape / 2.5s
portrait, skippable by click, tap, the skip button, or `Escape`.

Sequence: the logo-reveal video plays at `playbackRate = 2` behind a vignette,
while the altimeter counts **304 → 0**, the Rio and Roma clocks tick, and a red
playhead sweeps a 220-tick ruler. Then the whole overlay lifts (`clip-path`,
0.7s) to uncover the hero.

**The handoff contract:** the hero poster *is* the video's final frame. The intro
uses the same `object-fit: cover` at the same viewport size as the hero, so the
lift has no seam. If that asset is ever re-cut, the poster must be re-exported
from the new final frame or the opening breaks.

When the intro runs it claims `window.__vpIntroRan`, and `hero-video.ts` stands
down — the reveal is never played twice in one view.

---

## 6. Logo

- The graffiti wordmark is the logo: **VIDA** filled with the Brazilian flag,
  **PIENA** with the Italian tricolore. It is the only place either flag appears.
- Masters in `visual-references/`. In-page the wordmark is currently set as
  tracked display type (`Vidapiena`, `0.28em`); the artwork appears through the
  hero poster and the reveal video.
- The sprayed underline (`SprayStroke.astro`) is the one graffiti device
  available to other sections. One per section heading, coloured via `--stroke`,
  defaulting to `ouro`.
- **The circular badge** (22 Jul amendment): `visual-references/new-logo.jpeg`
  is the official round mark — Francesco inside the yellow ring. In-repo copy:
  `src/assets/logos/vidapiena-badge.jpg`, rendered only through
  `BrandBadge.astro` (circle crop, 4% overscan so the ring is the edge; the
  JPEG's black corners must never show). Never recolored, never rotated — the
  hero's orbit ring spins around it, not with it. Placements: nav (34px, every
  page), footer (56px), the hero **seal** (lower-right, ≥768px — see §12), the
  site icons (`scripts/make-icons.mjs`), JSON-LD `logo`.

---

## 7. Layout & spacing

- Gutters `px-5` / `md:px-10`. Content maxima `max-w-4xl` (prose), `max-w-5xl`
  (badges), `max-w-6xl` (grids).
- Section rhythm `py-20` / `md:py-28`; the CTA breathes wider at `py-24` /
  `md:py-36`.
- Hairlines are `ink/15` on light, `paper/10` on dark. Radius `0.5rem` for media,
  `999px` for buttons.
- `overflow-x: clip`, never `hidden` — `hidden` silently kills `position: sticky`,
  and the descent, the deck and the HUD all depend on it.

---

## 8. Components

- **Buttons.** `.btn-primary` is the gold pill with ink text (11.32:1). `.btn-ghost`
  is a hairline outline on dark. One primary per view.
- **`.eyebrow`** — the mono label above a heading. Often `[data-scramble]`.
- **`.link-sweep`** — underline enters from the left, leaves to the right, so the
  line travels with the cursor instead of collapsing.
- **Zone card** — translucent ink panel over the backdrop, gloss + altitude in
  mono, Portuguese label as `h2`, sprayed underline in the zone grade.
- **Tour card** — the product. Photo in full colour, gentle 1.04 push-in on
  hover, price in mono with `tabular-nums`.
- **HUD motifs** — altimeter (right edge), corner furniture (left, desktop only,
  `mix-blend-mode: difference`), the ruler, and clocks formatted
  `[ RIO · HH:MM:SS ]`. The altimeter's active tick is gold and is deliberately
  **not** blended — difference would corrupt the accent.
- **Badges** — official partner marks, equal optical height, light ground, no
  filters ever. Motion may only translate the row.

---

## 9. Accessibility & i18n

- Target AA; most pairings above land AAA. Focus is a 2px gold ring at 2px offset
  — never removed.
- SplitText runs with `aria: 'auto'`: the readable string is written to
  `aria-label` before the characters are split, and the pieces are hidden from
  the tree. Scramble targets get their `aria-label` set before the first glyph
  churns. **Decorative text never reaches a screen reader mid-effect.**
- Decorative layers (`corners`, marquee rows, curtains, the ruler) are
  `aria-hidden`. Marquee clones are `aria-hidden`; only the first sequence
  carries real `alt` text.
- Italian is the default locale at `/`, English at `/en/`, with hreflang on both.
  Any new visible string needs a key in **both** `src/i18n/it.ts` and `en.ts`
  (`en.ts` is typed against `it.ts`, so a missing key fails the build).
- Portuguese brand words are exempt from translation by design (§1).

---

## 10. Photography

Curated by hand into `scripts/photo-manifest.json`, then processed by
`npm run photos` — the only sanctioned bridge from the local `media/` folder into
this public repo. Sharp auto-rotates, resizes, re-encodes with mozjpeg, and drops
all EXIF/GPS.

**Privacy rule: scenery, street art, and Francesco. No identifiable guests.** The
community strip is deliberately built from murals, mosaics and vistas for exactly
this reason.

One more ban: **AI-generated frames never pose as photographs of the product.**
`zone-5-asfalto` (a Nano Banana render) is excluded from tour galleries and the
Instagram band; if it is ever used again it must read as artwork, not as a photo.

Keep processed files under ~400 KB; the pipeline warns above it.

---

## 11. Multi-page addendum (22 Jul 2026 redesign)

The one-pager became a 22-page site (home ×2 locales, 4 tour pages ×2, blog,
la-guida, contatti ×2, 404). Rules added by that redesign:

### Nav

- One fixed header (`Nav.astro`) on every page — a **floating glass island**
  (22 Jul 2026, later): a frosted-ink pill (`radius 999px`, `backdrop-filter:
  blur(16px)`, hairline + a soft elevation shadow, no glow) detached from every
  edge, centred and capped at `75rem` so it aligns to the `px-10` content
  gutters at laptop widths and floats free on larger screens. `.site-nav` is
  the click-through frame (a `0.75rem` top float gap, `pointer-events: none`);
  only `.nav-island` catches events. The `--nav-h` (4rem) contract still holds —
  `0.75rem` gap + `3.25rem` island = `4rem` to the island's bottom edge, so
  anchor offsets and drawer padding are unchanged. Landing uses the `overlay`
  variant — the island floats light (`ink/0.32`) over the hero and condenses to
  solid (`ink/0.68`) past 60% of it (JS flip; **the static path forces solid
  from first paint**). Subpages are always solid. A `@supports not
  (backdrop-filter)` fallback makes it near-opaque so the frost never leaves
  text on a bare photo.
- The drawer is a full-screen ink panel *under* the bar (bar stays usable), its
  a11y state machine ships **outside** the motion gate, and its stagger is pure
  CSS (`--i` delays) behind `prefers-reduced-motion`. The footer duplicates the
  five links — that is the no-JS path into the site.
- In-page anchor targets need `scroll-margin-top: calc(var(--nav-h) + …)`.

### Scrollbar

`color-scheme: dark` + `scrollbar-color` on `html` (plus `::-webkit-scrollbar`
for classic-scrollbar Safari) — thumb is paper-26%-on-ink, track is ink. Never
ship a light scrollbar on the ink page again.

### Tours

- The catalogue is a **grid, all four visible** — depth is an entrance
  (translateZ rise, once) and a ±3° hover tilt, never a state that hides cards.
- Every tour has a detail page (`/tour/<slug>/`, slug locale-invariant). Facts
  live in `tours.ts`, copy in the dicts under `tourPage`; the two may not drift.

### Booking

- OTA-platform-only, by client decision (21 Jul): **no WhatsApp anywhere**.
  Instagram DM is the one direct channel.
- Per-tour badges render **only live platforms** from `otaLinks` (never a
  placeholder); outbound OTA links carry
  `rel="noopener noreferrer sponsored" target="_blank"`. The global TrustBadges
  row stays unlinked. Full link matrix: `Context Knowledge/OTA-LINKS.md`.

### Pages

Subpages open with `PageHero` (mono kicker + display h1 on ink, cleared under
the nav) and close with the shared Footer. Long-form copy sits on paper bands,
`max-w-prose`. JSON-LD is per-page (`Base`'s `head` slot), breadcrumbs on tour
pages only.

---

## 12. The continuum (22 Jul 2026 amendment)

The landing no longer reads as stacked bands: the descent (304 m → 0 m) came
back as the page's spine, told through ambient colour and a handful of
structural devices.

- **Zone washes.** Each ink band carries ONE radial wash from the descent
  grade — azzurro (tours), verde (community), ouro (instagram) — via the
  `band-tint-*` utilities, mixes ≤13%. They are grade-scrims, not decoration;
  they never become text colours and never stack two hues on one band.
- **Scrims.** Text over photography sits on `.scrim-b` (raised floor: ≥80%
  ink under the copy, never under 38% at the top). No ad-hoc gradients.
- **Morro seams.** Ink↔paper transitions cross `MorroDivider.astro` — a
  stepped favela roofline (flat tops, one water tank, one antenna, max one
  accent window). Pure markup, identical on both paths: a seam that needs JS
  is a seam that can break. Adjacent sections trim their padding — the
  divider IS the gap.
- **The descent rail.** `RouteMark.astro` per band (≥1440px, HudCorners'
  budget): dashed gutter line + mono altitude waypoint (304 azzurro · 180
  verde · 120 verde-scuro · 60 ouro · 0 rosso "livello del mare").
  `spatial.ts` scrubs each segment's scaleY as its section crosses; the
  static path shows the full line (pre-hide in JS only).
- **Straddles.** Objects may cross seams — the guide portrait (`md:-mt-24`).
  One straddle per seam; never text. (22 Jul 2026, later: the hero badge is **no
  longer** a straddle. At a full `100svh` hero its seam IS the viewport fold, so
  a straddling badge is always bisected at first paint — and the intro→poster
  contract (§5) forbids shrinking the hero to reveal the seam. It is now a
  fully-visible **seal** in the hero's lower-right, ≥768px; on phones the
  bottom-anchored headline fills the lower two-thirds, so the seal stands down.)
- **Light bands float.** Full-bleed paper is retired as a rhythm device on
  the landing: light surfaces are floating paper panels on the ink canvas
  (TrustBadges). `#guida` remains the one full-bleed paper band, bounded by
  morro seams on both sides.

### Marquee resilience (same amendment)

Marquee rows are dual-engine. Base: a pure CSS `mq-drift` loop under
`.motion-ok` (global.css) over a server-rendered EVEN count of identical
sequences — `translateX(-50%)` always lands on identical content; duplicates
carry `.mq-dupe` and stay `display:none` on the static path. Enhancement:
`marquees.ts` adopts the live CSS position (DOMMatrix `m41`), pins it inline,
adds `.is-js` (kills the keyframe loop) and continues with the
scroll-velocity boost — no blank frame at the handoff, and it must run before
`fill()` adds clones. One failed init can no longer freeze a band: `main.ts`
isolates every init in its own try/catch (`[vp] <name> init failed` in the
console is the tell). `?vpdebug=1` exposes `window.__vp = { gsap,
ScrollTrigger }` for manual-clock verification on machines where rAF is
frozen.
