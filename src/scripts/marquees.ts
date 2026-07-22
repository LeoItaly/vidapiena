/**
 * Scroll-velocity marquees.
 *
 * Every row drifts on its own at a constant base speed and gets *added* to by
 * how fast the page is moving. The boost is magnitude-only, so a row never
 * reverses when you scroll up — it just hurries. Stop, and it settles back to
 * its idle drift rather than stopping dead.
 *
 * One ticker drives everything: velocity is sampled once per frame and shared,
 * and rows off screen are skipped via a live viewport read (never a cached
 * scroll position, so a late font swap or lazy image can't strand a row).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR } from './motion-tokens';

gsap.registerPlugin(ScrollTrigger);

/** Scroll speed (px/s) that corresponds to the top of the boost curve. */
const VELOCITY_CEILING = 1200;
/** Multiplier the boost applies on top of a row's base speed. */
const BOOST_MAX = 6;
/** How much of the boost each row takes — under 1 keeps fast flings readable. */
const BOOST_SHARE = 0.6;
/** Frame-time clamp: a backgrounded tab must not teleport the rows. */
const MAX_FRAME_MS = 50;
/** Off-screen slack (px): start drifting just before a row scrolls in. */
const SCREEN_MARGIN = 200;

const toBoost = gsap.utils.mapRange(0, VELOCITY_CEILING, 0, BOOST_MAX);

interface Row {
  root: HTMLElement;
  dir: number;
  base: number;
  pos: number;
  span: number;
  onScreen: boolean;
  setX: (value: number) => void;
  measure: () => void;
}

const rows: Row[] = [];
let smoothed = 0;
let lastScrollY = 0;
let started = false;

function buildRow(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-marquee-track]');
  const seq = root.querySelector<HTMLElement>('[data-marquee-seq]');
  if (!track || !seq) return;

  const dir = Number(root.dataset.dir ?? 1) >= 0 ? 1 : -1;
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const base = Number(root.dataset.speed ?? 60) * (mobile ? 0.5 : 1);

  // Adopt the CSS base drift (global.css `mq-drift`), then take over: read the
  // animated position, pin it as the inline transform, and only then switch
  // the keyframe loop off — no blank frame between the two owners. This must
  // happen before fill(): extra clones would break the -50% loop's geometry.
  const setX = gsap.quickSetter(track, 'x', 'px') as (value: number) => void;
  const cssTransform = getComputedStyle(track).transform;
  const adopted =
    cssTransform && cssTransform !== 'none' ? new DOMMatrixReadOnly(cssTransform).m41 : 0;
  setX(adopted);
  root.classList.add('is-js');

  // Enough copies to cover the viewport twice over, so no seam is ever on
  // screen. Clones are decorative — the first sequence carries the alt text.
  const fill = () => {
    const span = seq.offsetWidth;
    if (!span) return 0;
    const needed = Math.max(2, Math.ceil((window.innerWidth * 2) / span) + 1);
    while (track.children.length < needed) {
      const clone = seq.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('data-marquee-seq');
      clone.querySelectorAll('img').forEach((img) => img.setAttribute('aria-hidden', 'true'));
      // aria-hidden alone leaves cloned links tab-reachable — pull them out.
      clone.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
      track.appendChild(clone);
    }
    return span;
  };

  const row: Row = {
    root,
    dir,
    base,
    pos: adopted,
    span: fill(),
    onScreen: false,
    setX,
    measure: () => {
      row.span = seq.offsetWidth || row.span;
      fill();
    },
  };
  rows.push(row);
}

function tick(_time: number, deltaMs: number): void {
  const dt = Math.min(deltaMs, MAX_FRAME_MS) / 1000;
  if (dt <= 0) return;

  // Sample once per frame, share with every row.
  const y = window.scrollY;
  const velocity = Math.abs(y - lastScrollY) / dt;
  lastScrollY = y;
  smoothed += (velocity - smoothed) * 0.12;
  const boost = toBoost(smoothed); // deliberately unclamped — flings overshoot

  // Phase 1 — read each row's live on-screen state in one batch. A live rect
  // can't go stale the way a cached ScrollTrigger start/end can once the display
  // font swaps or the lazy images land and shift the band down the page — that
  // drift is what used to leave the row marked inactive right where you're
  // looking at it (CSS drift already off via `.is-js`, so it reads as dead).
  const vh = window.innerHeight;
  for (const row of rows) {
    const rect = row.root.getBoundingClientRect();
    row.onScreen = rect.bottom > -SCREEN_MARGIN && rect.top < vh + SCREEN_MARGIN;
  }
  // Phase 2 — write. Transforms don't affect layout, but keeping the writes out
  // of the read loop keeps it obviously reflow-free.
  for (const row of rows) {
    if (!row.onScreen || !row.span) continue;
    row.pos += row.dir * row.base * (1 + boost * BOOST_SHARE) * dt;
    row.setX(gsap.utils.wrap(-row.span, 0, row.pos));
  }
}

/** The band opens with a black curtain pulling up off the content. */
function revealCommunity(): void {
  const section = document.querySelector<HTMLElement>('[data-community]');
  const curtain = section?.querySelector<HTMLElement>('[data-community-curtain]');
  if (!section || !curtain) return;

  gsap.fromTo(
    curtain,
    { scaleY: 1 },
    {
      scaleY: 0,
      duration: DUR.curtain,
      ease: 'vpInOut',
      scrollTrigger: { trigger: section, start: 'top 70%', once: true },
    }
  );
}

export function initMarquees(): void {
  revealCommunity();

  const roots = gsap.utils.toArray<HTMLElement>('[data-marquee-row]');
  if (!roots.length) return;

  roots.forEach(buildRow);
  if (!rows.length) return;

  lastScrollY = window.scrollY;
  if (!started) {
    gsap.ticker.add(tick);
    started = true;
  }

  // Widths change with the viewport and once lazy images land.
  ScrollTrigger.addEventListener('refresh', () => rows.forEach((r) => r.measure()));
  window.addEventListener('load', () => rows.forEach((r) => r.measure()), { once: true });
}
