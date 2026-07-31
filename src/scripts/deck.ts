/**
 * The tour deck controller — a horizontal pile of photos flipped like a deck
 * of cards. CSS (TourGallery.astro) renders a readable scroll-snap strip and
 * owns the pile's coordinate space; this module turns that strip into the pile
 * and drives every card transform.
 *
 * Resilience (DESIGN.md §4/§12): it adds `.is-live` to the section as its LAST
 * setup step, so any throw before that leaves the strip untouched — a failed
 * deck is a strip, never a frozen pile. No ScrollTrigger here (unlike the old
 * vertical deck): the cards are never sticky, so there is no pinned-rect
 * measurement to correct for. Budget: transform + opacity only; per-frame
 * callbacks (onDrag) write, never read layout.
 */
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import './motion-tokens';

gsap.registerPlugin(Draggable, InertiaPlugin);

/** Velocity tracking is added to Draggable by InertiaPlugin; type it in. */
type Fling = Draggable & { getVelocity?(axis: 'x' | 'y'): number };

// Depth presentation, front (0) to back. Cards deeper than SLOTS are parked in
// HIDDEN so a tall deck never paints more than three lifted cards.
const SLOTS = [
  { x: 0, y: 0, rot: 0, scale: 1, shade: 0 },
  { x: 26, y: 14, rot: 3, scale: 0.95, shade: 0.14 },
  { x: 50, y: 28, rot: 5.5, scale: 0.9, shade: 0.24 },
] as const;
const HIDDEN = { x: 64, y: 36, rot: 6, scale: 0.87, shade: 0.3 } as const;

const SETTLE = 0.5; // slot-to-slot ease (seconds)
const THROW = 0.42; // fling-out duration
const FLING_VELOCITY = 520; // px/s past which a short drag still advances

function slot(depth: number): (typeof SLOTS)[number] | typeof HIDDEN {
  return depth < SLOTS.length ? SLOTS[depth] : HIDDEN;
}

export function initDeck(): void {
  document.querySelectorAll<HTMLElement>('[data-deck-stage]').forEach(setupDeck);
}

function setupDeck(stage: HTMLElement): void {
  const section = stage.closest<HTMLElement>('[data-deck]');
  const track = stage.querySelector<HTMLElement>('.deck-track');
  const items = gsap.utils.toArray<HTMLElement>('[data-deck-item]', stage);
  if (!section || !track || items.length < 2) return;

  const n = items.length;
  const counter = section.querySelector<HTMLElement>('[data-deck-current]');
  const status = section.querySelector<HTMLElement>('[data-deck-status]');
  const statusTpl = status?.dataset.statusTpl ?? 'Foto %c di %t';
  const dots = gsap.utils.toArray<HTMLElement>('[data-deck-dot]', section);
  const prevBtn = section.querySelector<HTMLElement>('[data-deck-prev]');
  const nextBtn = section.querySelector<HTMLElement>('[data-deck-next]');
  const shadeOf = (i: number) => items[i].querySelector<HTMLElement>('.deck-shade');
  const pad = (v: number) => String(v).padStart(2, '0');

  // order[0] is the top card; the array is always a rotation of [0..n-1].
  let order = items.map((_, i) => i);
  let busy = false;
  // Sampled once per drag on press, so onDrag stays write-only (no layout read).
  let dragThreshold = 0;

  function setHeight(): void {
    // 4:3 off the live (capped) track width. One reflow, on init/resize only.
    track!.style.height = `${Math.round(track!.clientWidth * 0.75)}px`;
  }

  function place(cardIdx: number, depth: number, animate: boolean): void {
    const s = slot(depth);
    const card = { x: s.x, y: s.y, rotation: s.rot, scale: s.scale, autoAlpha: depth < SLOTS.length ? 1 : 0, zIndex: n - depth };
    const shade = shadeOf(cardIdx);
    if (animate) {
      // Slot-to-slot transition on the shared reveal curve.
      gsap.to(items[cardIdx], { ...card, duration: SETTLE, ease: 'vpOut', overwrite: 'auto' });
      if (shade) gsap.to(shade, { opacity: s.shade, duration: SETTLE, ease: 'vpOut', overwrite: 'auto' });
    } else {
      // Synchronous: no ticker frame needed, so the first paint is already the
      // laid-out pile (no seeded-hidden flash) and a resize snaps instantly.
      gsap.set(items[cardIdx], { ...card, overwrite: 'auto' });
      if (shade) gsap.set(shade, { opacity: s.shade, overwrite: 'auto' });
    }
    const front = depth === 0;
    items[cardIdx].setAttribute('aria-hidden', front ? 'false' : 'true');
    items[cardIdx].classList.toggle('is-grabbable', front);
    items[cardIdx].style.pointerEvents = front ? 'auto' : 'none';
  }

  function layout(animate: boolean, skip = -1): void {
    order.forEach((cardIdx, depth) => {
      if (cardIdx !== skip) place(cardIdx, depth, animate);
    });
    chrome();
  }

  function chrome(): void {
    const front = order[0];
    if (counter) counter.textContent = pad(front + 1);
    if (status) {
      status.textContent = statusTpl.replace('%c', String(front + 1)).replace('%t', String(n));
    }
    dots.forEach((dot, i) => dot.toggleAttribute('data-active', i === front));
  }

  function threshold(): number {
    return Math.max(56, (stage.clientWidth || track!.clientWidth) * 0.16);
  }

  function finish(): void {
    busy = false;
    const frontDrag = drags[order[0]];
    frontDrag.enabled(true);
    frontDrag.update();
    chrome();
  }

  function advance(dir: 'next' | 'prev', fromX = 0): void {
    if (busy || n < 2) return;
    busy = true;
    drags.forEach((d) => d.enabled(false));
    const w = stage.clientWidth || track!.clientWidth || 600;

    if (dir === 'next') {
      const out = order[0];
      order = [...order.slice(1), out];
      const sign = fromX < 0 ? -1 : 1;
      layout(true, out); // everyone else slides forward one slot
      gsap.to(items[out], {
        x: sign * w * 1.15,
        y: 48,
        rotation: sign * 12,
        autoAlpha: 0,
        duration: THROW,
        ease: 'vp',
        onComplete() {
          place(out, order.indexOf(out), false); // park at the back, hidden
          finish();
        },
      });
    } else {
      const incoming = order[n - 1];
      order = [incoming, ...order.slice(0, n - 1)];
      // stage the returning card off to the left, then fly the whole pile home
      gsap.set(items[incoming], {
        x: -w * 1.15,
        y: 48,
        rotation: -12,
        scale: 1,
        autoAlpha: 0,
        zIndex: n + 1,
      });
      layout(true);
      gsap.delayedCall(SETTLE, finish);
    }
  }

  function goTo(cardIdx: number): void {
    if (busy || cardIdx === order[0]) return;
    const depth = order.indexOf(cardIdx);
    if (depth < 1) return;
    order = [...order.slice(depth), ...order.slice(0, depth)];
    busy = true;
    drags.forEach((d) => d.enabled(false));
    layout(true);
    gsap.delayedCall(SETTLE, finish);
  }

  function snapBack(): void {
    busy = true;
    drags.forEach((d) => d.enabled(false));
    layout(true); // returns the front card and the peek card to their slots
    gsap.delayedCall(SETTLE, finish);
  }

  // --- Draggable per card; only the front one is ever enabled. ------------
  const drags: Draggable[] = items.map((item, idx) => {
    let d: Fling;
    d = Draggable.create(item, {
      type: 'x',
      inertia: false,
      allowNativeTouchScrolling: false,
      onPress() {
        item.classList.add('is-grabbing');
        dragThreshold = threshold();
        gsap.killTweensOf(item);
      },
      onDrag() {
        if (order[0] !== idx) return;
        const p = gsap.utils.clamp(0, 1, Math.abs(d.x) / dragThreshold);
        gsap.set(item, { rotation: d.x * 0.04 });
        const nextIdx = order[1];
        const next = items[nextIdx];
        if (next) {
          gsap.set(next, {
            x: SLOTS[1].x * (1 - p),
            y: SLOTS[1].y * (1 - p),
            rotation: SLOTS[1].rot * (1 - p),
            scale: SLOTS[1].scale + (1 - SLOTS[1].scale) * p,
          });
          const sh = shadeOf(nextIdx);
          if (sh) gsap.set(sh, { opacity: SLOTS[1].shade * (1 - p) });
        }
      },
      onRelease() {
        item.classList.remove('is-grabbing');
      },
      onDragEnd() {
        const vel = d.getVelocity ? d.getVelocity('x') : 0;
        const thrown = Math.abs(d.x) > dragThreshold || Math.abs(vel) > FLING_VELOCITY;
        if (thrown && order[0] === idx) advance('next', d.x);
        else snapBack();
      },
    })[0] as Fling;
    d.enabled(false);
    return d;
  });

  // --- controls -----------------------------------------------------------
  nextBtn?.addEventListener('click', () => advance('next'));
  prevBtn?.addEventListener('click', () => advance('prev'));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      advance('next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      advance('prev');
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(n - 1);
    }
  });

  // Height tracks the live (capped) track width at 4:3, and re-lays-out on
  // resize. A ResizeObserver also covers being measured while the pane is
  // hidden (clientWidth 0): the first real size fires it and builds the pile
  // for real — no dependence on the initial synchronous measurement landing.
  let lastW = -1;
  const relayout = () => {
    const w = track!.clientWidth;
    if (w === lastW) return;
    lastW = w;
    setHeight();
    layout(false);
  };
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(relayout).observe(track);
  } else {
    window.addEventListener('resize', relayout);
  }

  // --- go live (last, so any throw above leaves the strip intact) ---------
  // The .deck-track already carries tabindex=0 (it is the keyboard entry in
  // both forms); its keydown bubbles to this stage handler in the pile.
  section.classList.add('is-live');
  setHeight();
  layout(false);
  drags[order[0]].enabled(true);
}
