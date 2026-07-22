import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './motion-tokens';

gsap.registerPlugin(ScrollTrigger);

/*
 * The tours grid — all four cards visible at once. What remains of the old
 * deck's 3D is an entrance and a hover: cards rise out of the depth corridor
 * (translateZ) with a stagger the first time the grid scrolls in, and on fine
 * pointers a quickTo tilt (±3°) keeps the stage alive. Depth stays transform +
 * opacity only — no filters — and the pre-hide happens here, not in CSS, so a
 * failed init can never leave the grid invisible.
 */
export function initToursGrid(): void {
  const root = document.querySelector<HTMLElement>('[data-tours-grid]');
  if (!root) return;
  const cards = gsap.utils.toArray<HTMLElement>('[data-grid-card]', root);
  if (!cards.length) return;

  gsap.set(cards, { z: -420, y: 32, autoAlpha: 0 });
  gsap.to(cards, {
    z: 0.01,
    y: 0,
    autoAlpha: 1,
    duration: 0.9,
    ease: 'vpOut',
    stagger: 0.12,
    clearProps: 'transform',
    scrollTrigger: { trigger: root, start: 'top 72%', once: true },
  });

  if (!window.matchMedia('(pointer: fine)').matches) return;

  cards.forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'vpOut' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'vpOut' });
    const z = gsap.quickTo(card, 'z', { duration: 0.5, ease: 'vpOut' });
    // Rect cached on enter — no layout reads inside the move handler.
    let rect: DOMRect | null = null;

    card.addEventListener('pointerenter', () => {
      rect = card.getBoundingClientRect();
    });
    card.addEventListener('pointermove', (e) => {
      if (!rect) return;
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      ry(px * 6);
      rx(py * -6);
      z(18);
    });
    card.addEventListener('pointerleave', () => {
      rect = null;
      rx(0);
      ry(0);
      z(0);
    });
  });
}
