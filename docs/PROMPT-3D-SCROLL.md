# Prompt — Cinematic 3D Scroll Website (Vidapiena edition)

> Adapted 20 Jul 2026 from a "chained descent" template (deep-sea expedition site: five AI video clips joined final-frame→start-frame, scroll-scrubbed as one journey). Geography flipped to match Francesco's real tours: mototaxi **up**, walk **down** through the community — so the site descends from the mirante at dawn to the beach at sunset, altitude HUD counting **304m → 0m**. Emotional arc: postcard → real life inside → "meet me at sea level" (where his meeting points actually are).

## The prompt (copy-paste)

```
P R O M P T · E X P E R I E N C E / S T O R Y T E L L I N G
The Journey — Rio hillside descent (Vidapiena edition)

Build me an award-winning cinematic "3D scroll" website for VIDAPIENA — an Italian guide's
small-group favela experiences in Rio de Janeiro, led by Francesco: Italian, 9 years in Rio,
tours in Italian, English and Portuguese. Brand idea: "vida piena" = a full life. Positioning:
everyone photographs Rio's view — his guests walk down through the life inside it.

VISUALS — Seedance 2.0 on the Higgsfield MCP (std mode, 1080p, 16:9, no audio, ~8–10s per clip).
First generate ONE hero image of THE GUIDE — athletic man seen only from behind or in silhouette
(never a recognizable face), olive tee + cap, standing at a hilltop railing above Rio at dawn:
Ipanema and Leblon beaches, the lagoon, Sugarloaf, warm gold light, colorful stacked houses
cascading below — and reference it in every clip for continuity of figure, palette and geography.
Imagery must show the favela as a warm, dignified, living community — everyday life, color, music,
football, commerce; no poverty clichés, no legible signage/text, no identifiable faces.
CRITICAL: generate clips in order and use each clip's FINAL frame as the START image of the next
(Seedance start_image / end_image) so all five join into one seamless, unbroken descent:

1. O MIRANTE (the lookout, 304m) — aerial dawn over Rio (Christ the Redeemer, Sugarloaf, the sea)
   drifting toward a green morro wrapped in a hillside community; a mototaxi crests the final ramp;
   the guide steps to the lookout railing, back to camera, city glowing gold below.
2. AS LAJES (the rooftops) — the guide leads down onto rooftop level: kites overhead, water tanks,
   a rooftop churrasco, the beach glittering far below between lajes; ends at the mouth of a
   stairway plunging between houses.
3. OS BECOS (the alleys) — descending stairways between color-washed walls: laundry lines, a
   graffiti-covered wall, a caged football pitch with kids playing, fruit stalls, shafts of midday
   sun cutting between buildings.
4. A LADEIRA (the steep street) — the winding access road: mototaxis buzzing past, murals, small
   shops, golden-hour light, the sea appearing at the bottom of the street between buildings.
5. O ASFALTO (sea level, 0m) — sunset at the beach: waves, the twin peaks of Dois Irmãos
   silhouetted behind — the very hill just descended — the guide half-turned toward camera in
   silhouette on the sand; hold a final hero frame.

WEBSITE — concatenate the five clips and scroll-scrub the full descent as a canvas frame sequence:
scrolling down IS walking down the morro. Fixed HUD altitude meter counting 304m → 0m with the five
Portuguese zone labels (+ tiny English gloss). Sections pinned per zone:
hero ("The view is just the beginning. Rio happens on the way down.") →
one striking true fact per zone: MIRANTE — voted one of the most beautiful views in Rio: Ipanema,
Leblon, the lagoon and Sugarloaf in one frame · LAJES — rooftops are the favela's piazzas:
barbecues, kite battles, samba · BECOS — roughly one carioca in five lives in a favela; some alleys
are no-photo out of respect — "some views you keep only in your memory" · LADEIRA — "We warm up the
engines": every tour opens with a mototaxi ride to the top, included, helmets on →
THE GUIDE callout (specs-style stat grid): Italian · 9 years in Rio · tours in IT / EN / PT ·
small groups, max 19 · mototaxi + community visitation fee included →
four tour cards: Favela Tour Rocinha (3h, R$270 — Brazil's largest favela, graffiti gallery, an
Italian NGO working there 20+ years) · Favela Tour Vidigal (2h30, R$270 — panoramic terrace bar
facing Christ the Redeemer) · Favela Tour Tavares Bastos (2h30, R$270 — play on the iconic FIFA
Street pitch) · Un Giorno a Rio (full-day premium from R$780/person: Christ the Redeemer, Santa
Teresa, Selarón Steps, Sugarloaf, hotel pick-up) →
"One guide. Three languages. From R$270. Departing daily." →
"Meet me at sea level" CTA — every tour starts on the asphalt — with WhatsApp button and
Instagram @vidapiena. Background color-grades dawn gold → tropical daylight → golden hour → dusk
violet as you descend; single warm amber accent; confident humanist display type with thin
technical sans for the HUD micro-details. All site copy in English, with "guided in Italian by a
native speaker" made unmissable. Launch on localhost and verify the scrub is seamless across all
five clips before telling me it's done.
```

## Notes

- **No real faces in generated clips.** The recurring anchor is a from-behind/silhouette guide figure — AI video can't hold a real person's likeness across clips, and we don't generate Francesco's face on principle. Real photos of him go in the guide section instead.
- **Every fact in the prompt is true** and traceable to `Context Knowledge/note tours.md` (terrace bar facing the Cristo, FIFA Street pitch, no-photo alleys, mototaxi opening, Italian NGO in Rocinha 20+ years).
- The clip-5 payoff — ending on the beach with **Dois Irmãos on the horizon, the hill you just scrolled down** — is the money shot. Don't let it get simplified away.
- **Variant available**: same chained structure as "Un Giorno a Rio" dawn-to-dusk (Cristo → Santa Teresa → Selarón → Sugarloaf → sunset), HUD as a clock instead of an altimeter.
- **Site-copy language** says English here (OTA convention); final call depends on the language strategy in [VISION.md](VISION.md) (IT-first is on the table for the real site).
