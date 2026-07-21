import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// Idempotent with descent.ts — set here too so this module is import-order independent.
ScrollTrigger.config({ ignoreMobileResize: true });

/*
 * Depth fly-through for the tour cards.
 *
 * Same shape as the descent: one paused timeline, scrubbed by a proxy tween so
 * every consumer reads the identical eased progress. Each card owns one unit of
 * the timeline — it holds still at the front for the first ~65% of its unit,
 * then accelerates past the camera while the next card rises out of the depth,
 * both landing exactly on the unit boundary. Depth comes from perspective scale
 * and opacity alone: no filters, which is what keeps this affordable on phones.
 */

/** Fraction of a card's unit spent holding still at the front. */
const HOLD = 0.65;
const EXIT_DUR = 1 - HOLD;
const ENTER_DUR = 0.4;

interface Depth {
  /** translateZ the card rises from, in px (negative = away from the camera). */
  zFrom: number;
  /** translateZ the card exits to (positive = past the camera). */
  zExit: number;
  /** Sideways drift on exit, in % of card width. */
  drift: number;
  /** Y-axis tilt on exit, in degrees. */
  rotY: number;
}

function createCounterBinding(root: HTMLElement, total: number) {
  const counter = root.querySelector<HTMLElement>('[data-deck-counter]');
  const ticks = Array.from(root.querySelectorAll<HTMLElement>('[data-deck-tick]'));
  const pad = (n: number) => String(n).padStart(2, '0');
  let last = -1;

  return (p: number) => {
    // Flips exactly as the incoming card lands. Write-only: no layout reads.
    const idx = Math.min(total - 1, Math.floor(p * total));
    if (idx === last) return;
    if (counter) counter.textContent = `${pad(idx + 1)} / ${pad(total)}`;
    ticks.forEach((tick, i) => tick.classList.toggle('is-active', i === idx));
    last = idx;
  };
}

export function initToursDeck(): void {
  const root = document.querySelector<HTMLElement>('[data-tours-deck]');
  if (!root) return;
  const cards = gsap.utils.toArray<HTMLElement>('.deck-card', root);
  if (cards.length < 2) return;

  const total = cards.length;
  const updateCounter = createCounterBinding(root, total);
  const mm = gsap.matchMedia();

  const build = (smooth: number | boolean, d: Depth) => {
    const tl = gsap.timeline({ paused: true });

    // Opening pose: first card already resolved, so a jump to #tour lands on a
    // finished frame rather than mid-flight.
    gsap.set(cards[0], { z: 0.01, autoAlpha: 1 });
    gsap.set(cards.slice(1), { z: d.zFrom, autoAlpha: 0 });

    cards.forEach((card, i) => {
      if (i > 0) {
        tl.fromTo(
          card,
          { z: d.zFrom, autoAlpha: 0 },
          { z: 0.01, autoAlpha: 1, duration: ENTER_DUR, ease: 'power2.out' },
          i - ENTER_DUR
        );
      }
      if (i < total - 1) {
        tl.to(
          card,
          {
            z: d.zExit,
            autoAlpha: 0,
            xPercent: i % 2 ? d.drift : -d.drift,
            rotationY: i % 2 ? -d.rotY : d.rotY,
            duration: EXIT_DUR,
            ease: 'power2.in',
          },
          i + HOLD
        );
      }
    });

    // Spacer so the last card holds for a full beat before the section releases.
    tl.to({}, { duration: total - tl.duration() });

    // `autoAlpha` (not opacity) is load-bearing: off-stage cards get
    // visibility:hidden, which drops their WhatsApp links out of the tab order
    // and the accessibility tree. Nothing invisible can take focus.
    const proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: smooth,
      },
      onUpdate: () => {
        tl.progress(proxy.p);
        updateCounter(proxy.p);
      },
    });
  };

  // Desktop: eased scrub, deeper corridor. Mobile: direct scrub, shallower
  // depth and no tilt — cheapest per frame. Reduced motion registers nothing.
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () =>
    build(0.6, { zFrom: -1400, zExit: 460, drift: 14, rotY: 5 })
  );
  mm.add('(prefers-reduced-motion: no-preference) and (max-width: 767.98px)', () =>
    build(true, { zFrom: -1000, zExit: 300, drift: 10, rotY: 0 })
  );
}
