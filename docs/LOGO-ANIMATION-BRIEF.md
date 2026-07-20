# Logo Animation Brief — Higgsfield MCP

**Status (20 Jul 2026, evening): ✅ COMPLETE — all deliverables generated and verified** (3-day Plus trial, 103 credits total, 7 left)

| Deliverable | File | Specs | Job ID |
| :--- | :--- | :--- | :--- |
| Hero reveal 16:9 | [`exports/logo-animation-16x9.mp4`](../visual-references/exports/logo-animation-16x9.mp4) | Seedance 2.0 std, 1920×1080, 6s, silent, 54 cr | `01501785-8519-440a-bcd0-7a6e8c0bca9a` |
| Vertical reveal 9:16 (Reels/Stories/mobile) | [`exports/logo-animation-9x16.mp4`](../visual-references/exports/logo-animation-9x16.mp4) | Seedance 2.0 std, 1080×1920, 5s, silent, 45 cr | `7530120d-01e6-4bb9-b1fc-f04b97e3f39e` |
| Poster frame 16:9 (LCP fallback + video `end_image`) | [`exports/logo-wall-composite-16x9.png`](../visual-references/exports/logo-wall-composite-16x9.png) | Nano Banana Pro, 1376×768, 2 cr | `5f97da76-089a-44f2-8b9a-50095cf5c066` |
| Poster frame 9:16 | [`exports/logo-wall-composite-9x16.png`](../visual-references/exports/logo-wall-composite-9x16.png) | Nano Banana Pro, 768×1376, 2 cr | `56e42220-c53a-42c5-9cbc-5618a9e9d136` |

**Verification (frame-sampled in browser):** both videos start on a bare weathered wall (old stains/posters only), the wordmark paints on progressively (VIDA → PIENA), and the final frame converges to the composite (mean abs pixel diff 15.7/255 on 16:9, 19.6/255 on 9:16 — codec-level match). Logo letterforms and flag fills faithful throughout.

**Recipe that worked (for future regenerations):** ① Nano Banana Pro composite of the exact logo on the wall (reference = logo `media_id d57a8a32-66b6-483a-b8e6-b9a817ad0f78`) → ② Seedance 2.0 (std) with composite as **`end_image`** + "locked camera, wall starts bare, spray-paint time-lapse, ends exactly at final frame" prompt. Verticals: **regenerate at 9:16** (a 9:16 composite first), never `reframe` (60 cr > 45-54 cr fresh).

**Asset**: [`../visual-references/Logo-Vidapiena.jpeg`](../visual-references/Logo-Vidapiena.jpeg) — graffiti wordmark "VIDA PIENA": VIDA filled with the Brazilian flag (green/yellow/blue globe), PIENA with the Italian tricolore, heavy black outline, sticker style on white.

## Concept (recommended): "Spray-paint reveal"

The logo is *painted live* on a favela wall. It's not decoration — graffiti is literally part of the product (the Rocinha tour visits the gallery of a graffiti artist born in the favela). The animation is the brand story in 6 seconds: Brazil + Italy, painted on Rio's walls.

**Shot description** (base prompt for `generate_video`, image-to-video with the logo as reference):

> Static camera on a rough sunlit concrete wall in a Rio favela, warm late-afternoon light. An unseen spray can paints the graffiti wordmark "VIDA PIENA" exactly as in the reference image: black outlines sketched first with aerosol hiss-mist, then "VIDA" floods with the green-yellow-blue of the Brazilian flag, then "PIENA" with the green-white-red Italian tricolore. Slight paint drips, fine aerosol particles in the light. The finished logo holds crisp and centered for the final 2 seconds, camera pushing in very slowly. No people, no readable text other than the logo itself.

**Alternates** (generate only if A disappoints):
- B — *Macro pull-back*: start on macro paint texture (wet green paint), pull back to reveal the finished logo on the wall as sunset light sweeps across.
- C — *Ink morph*: Brazilian and Italian flag inks flow in liquid motion and resolve into the wordmark on white (cleaner, more corporate — less on-brand).

## Workflow (once plan is active)

1. ~~Upload logo~~ ✅ done → `media_id d57a8a32-66b6-483a-b8e6-b9a817ad0f78`.
2. ~~Model choice~~ ✅ done → **Seedance 2.0** (`seedance_2_0`, std mode; supports `start_image`/`end_image`, identity-preserving).
3. ~~Wall composite~~ ✅ done → `job_id 5f97da76-089a-44f2-8b9a-50095cf5c066`.
4. Optional cheap validation: Seedance **Mini 480p 4s draft** (4 cr) with composite as `end_image`.
5. `generate_video` production: **seedance_2_0, std, 1080p, 16:9, 6s, `generate_audio:false`** (54 cr), `end_image` = composite job — prompt below; ends matching the composite exactly (clean hold).
6. **9:16 vertical**: fresh generation at 9:16 (54 cr) — cheaper than reframe (60 cr).
7. Review together → pick winner → save to `visual-references/exports/` + log in `UPDATES.md`.

## Deliverables

| File | Use |
| :--- | :--- |
| `logo-animation-16x9.mp4` | Website hero/intro, YouTube |
| `logo-animation-9x16.mp4` | Instagram Reels/Stories, mobile hero |
| Poster frame (final crisp logo, JPG/WebP) | LCP-safe static fallback + OG image base |

## ⚠️ Web-performance note (SEO hat on)

The video is for the **hero section and social**, not a blocking preloader. On the real site the intro must never delay LCP: render the poster frame instantly, stream the video after, skip it entirely on `prefers-reduced-motion` / slow connections. A future lightweight version (SVG stroke-draw or Lottie of the wordmark) can serve as an actual loader if we want one — separate task.
