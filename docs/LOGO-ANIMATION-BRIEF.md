# Logo Animation Brief — Higgsfield MCP

**Status: ready to run, not yet generated** (waits for go — generation spends Higgsfield credits).
**Asset**: [`../visual-references/Logo-Vidapiena.jpeg`](../visual-references/Logo-Vidapiena.jpeg) — graffiti wordmark "VIDA PIENA": VIDA filled with the Brazilian flag (green/yellow/blue globe), PIENA with the Italian tricolore, heavy black outline, sticker style on white.

## Concept (recommended): "Spray-paint reveal"

The logo is *painted live* on a favela wall. It's not decoration — graffiti is literally part of the product (the Rocinha tour visits the gallery of a graffiti artist born in the favela). The animation is the brand story in 6 seconds: Brazil + Italy, painted on Rio's walls.

**Shot description** (base prompt for `generate_video`, image-to-video with the logo as reference):

> Static camera on a rough sunlit concrete wall in a Rio favela, warm late-afternoon light. An unseen spray can paints the graffiti wordmark "VIDA PIENA" exactly as in the reference image: black outlines sketched first with aerosol hiss-mist, then "VIDA" floods with the green-yellow-blue of the Brazilian flag, then "PIENA" with the green-white-red Italian tricolore. Slight paint drips, fine aerosol particles in the light. The finished logo holds crisp and centered for the final 2 seconds, camera pushing in very slowly. No people, no readable text other than the logo itself.

**Alternates** (generate only if A disappoints):
- B — *Macro pull-back*: start on macro paint texture (wet green paint), pull back to reveal the finished logo on the wall as sunset light sweeps across.
- C — *Ink morph*: Brazilian and Italian flag inks flow in liquid motion and resolve into the wordmark on white (cleaner, more corporate — less on-brand).

## Workflow (next session, with Higgsfield MCP)

1. `media_upload` → upload `Logo-Vidapiena.jpeg` as reference/start image.
2. `models_explore(action:'recommend')` → goal: "logo reveal animation, image-to-video, graffiti spray paint effect, must preserve the exact logo artwork" — pick the model it recommends for identity-preserving image-to-video.
3. `generate_video` — specs: **1080p, 16:9, 6–8s, no audio**, end on a clean 2s hold (loop/poster-friendly final frame).
4. Repeat/reframe for **9:16 vertical** (Instagram Reels/Stories + mobile hero).
5. Review together → pick winner → save to `visual-references/` exports + log in `UPDATES.md`.

## Deliverables

| File | Use |
| :--- | :--- |
| `logo-animation-16x9.mp4` | Website hero/intro, YouTube |
| `logo-animation-9x16.mp4` | Instagram Reels/Stories, mobile hero |
| Poster frame (final crisp logo, JPG/WebP) | LCP-safe static fallback + OG image base |

## ⚠️ Web-performance note (SEO hat on)

The video is for the **hero section and social**, not a blocking preloader. On the real site the intro must never delay LCP: render the poster frame instantly, stream the video after, skip it entirely on `prefers-reduced-motion` / slow connections. A future lightweight version (SVG stroke-draw or Lottie of the wordmark) can serve as an actual loader if we want one — separate task.
