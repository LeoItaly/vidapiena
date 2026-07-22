/**
 * The tour deck's depth cues. CSS sticky owns the geometry (TourGallery.astro)
 * — this module only scrubs transform/opacity on the covered card and ticks
 * the mono counter, so a failed init degrades to a stack without settle-back,
 * never a broken layout.
 *
 * Measurement caveat: the deck items ARE the sticky elements, and a stuck
 * element's rect reports its pinned viewport offset, not its flow position.
 * Every ScrollTrigger measurement pass therefore un-sticks the items first
 * (refreshInit) and restores them after (refresh) — both happen inside the
 * same refresh cycle, so nothing ever paints un-stuck.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './motion-tokens';

gsap.registerPlugin(ScrollTrigger);

export function initDeck(): void {
  const decks = document.querySelectorAll<HTMLElement>('[data-deck]');
  const allItems: HTMLElement[] = [];

  decks.forEach((deck) => {
    const items = gsap.utils.toArray<HTMLElement>('[data-deck-item]', deck);
    if (items.length < 2) return;
    allItems.push(...items);

    const counter = deck.querySelector<HTMLElement>('[data-deck-current]');
    const pad = (n: number) => String(n + 1).padStart(2, '0');

    items.forEach((item, i) => {
      const card = item.querySelector<HTMLElement>('.deck-card');
      const shade = item.querySelector<HTMLElement>('.deck-shade');
      const next = items[i + 1];

      // Depth cue: while the NEXT card travels up, this one settles back and
      // dims — by the time it's covered, it reads as the card underneath.
      if (next && card && shade) {
        gsap
          .timeline({
            scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true },
          })
          .to(card, { scale: 0.94, ease: 'none' }, 0)
          .to(shade, { opacity: 0.3, ease: 'none' }, 0);
      }

      // The §3 deck counter — write-only frame work, tabular-nums in markup.
      if (counter) {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (self.isActive) counter.textContent = pad(i);
          },
        });
      }
    });
  });

  if (!allItems.length) return;

  ScrollTrigger.addEventListener('refreshInit', () => {
    allItems.forEach((el) => el.style.setProperty('position', 'static'));
  });
  ScrollTrigger.addEventListener('refresh', () => {
    allItems.forEach((el) => el.style.removeProperty('position'));
  });
  // Creation-time measurements may have run while items were already stuck
  // (mid-page reload restores scroll before boot) — re-measure once through
  // the listeners above.
  ScrollTrigger.refresh();
}
