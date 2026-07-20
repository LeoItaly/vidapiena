# Work Log

> Newest first. One entry per working session.

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
