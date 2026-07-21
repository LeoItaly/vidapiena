import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { BackdropRenderer } from './backdrop/types';
import { LayeredPhotoBackdrop } from './backdrop/layers';

gsap.registerPlugin(ScrollTrigger);
// Mobile URL-bar collapse fires resize storms; zone heights use svh so nothing moves.
ScrollTrigger.config({ ignoreMobileResize: true });

const ALTITUDE_TOP = 304;
const ZONE_COUNT = 5;

function createHudBinding() {
  const hud = document.querySelector<HTMLElement>('[data-hud]');
  const altEl = hud?.querySelector<HTMLElement>('[data-hud-alt]');
  const zoneEl = hud?.querySelector<HTMLElement>('[data-hud-zone]');
  const ticks = hud ? Array.from(hud.querySelectorAll<HTMLElement>('[data-hud-tick]')) : [];
  const zoneLabels = Array.from(document.querySelectorAll<HTMLElement>('[data-zone]')).map(
    (s) => s.querySelector('h2')?.childNodes[0]?.textContent?.trim() ?? ''
  );

  let lastAlt = -1;
  let lastZone = -1;

  return {
    hud,
    update(p: number) {
      // Write-only handler: textContent + class flips, never a layout read.
      const alt = Math.round(ALTITUDE_TOP * (1 - p));
      if (alt !== lastAlt && altEl) {
        altEl.textContent = String(alt);
        lastAlt = alt;
      }
      const zone = Math.min(ZONE_COUNT - 1, Math.floor(p * ZONE_COUNT));
      if (zone !== lastZone) {
        if (zoneEl && zoneLabels[zone]) zoneEl.textContent = zoneLabels[zone];
        ticks.forEach((tick, i) => tick.classList.toggle('is-active', i === zone));
        lastZone = zone;
      }
    },
  };
}

export function initDescent(): void {
  const root = document.getElementById('descent');
  const backdropRoot = root?.querySelector<HTMLElement>('[data-backdrop]');
  if (!root || !backdropRoot) return;

  const renderer: BackdropRenderer = new LayeredPhotoBackdrop();
  renderer.init(backdropRoot);
  const hud = createHudBinding();

  const mm = gsap.matchMedia();

  const build = (smooth: number | boolean) => {
    // Master scrub — THE single progress source. The proxy tween receives the
    // scrub smoothing, so every consumer (backdrop, HUD) sees the same eased p.
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
        renderer.render(proxy.p);
        hud.update(proxy.p);
      },
    });

    // HUD only exists while the descent is on screen.
    ScrollTrigger.create({
      trigger: root,
      start: 'top 75%',
      end: 'bottom 25%',
      onToggle: (self) => hud.hud?.classList.toggle('hud-visible', self.isActive),
    });

    // Zone cards rise in as their section arrives.
    root.querySelectorAll<HTMLElement>('.zone-card').forEach((card) => {
      gsap.from(card, {
        opacity: 0,
        y: 28,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card.closest('section'),
          start: 'top 65%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  };

  // Desktop: eased scrub. Touch/mobile: direct link (cheapest per frame).
  // Reduced-motion registers NOTHING — main.ts never loads this module then,
  // but the guard here keeps the invariant even if it did.
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => build(0.6));
  mm.add('(prefers-reduced-motion: no-preference) and (max-width: 767.98px)', () => build(true));

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
