/**
 * Motion-path extras for the site nav. The drawer's state machine lives in
 * Nav.astro's own (ungated) script; here are only the flourishes:
 * - overlay variant turns solid once the landing hero is behind you;
 * - a one-time entrance when the intro overlay lifts.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './motion-tokens';

gsap.registerPlugin(ScrollTrigger);

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;

  if (nav.dataset.variant === 'overlay') {
    const hero = document.querySelector('[data-hero]');
    if (hero) {
      ScrollTrigger.create({
        trigger: hero,
        start: '60% top',
        end: 'max',
        onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
      });
    }
  }

  // First visit: the intro covers the page; ride in as it lifts. The
  // `intro-pending` CSS keeps the nav invisible until this moment.
  if (document.documentElement.classList.contains('intro-pending')) {
    window.addEventListener(
      'vp:intro-done',
      () => {
        gsap.fromTo(
          nav,
          { y: -14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, ease: 'vpOut', clearProps: 'all' }
        );
      },
      { once: true }
    );
  }
}
