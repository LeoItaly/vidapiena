/**
 * The spatial layer — the small depth touches that aren't the tours grid:
 * corner furniture the page scrolls under, one slow parallax, and the generic
 * [data-stagger] group reveals.
 *
 * Everything here is decorative and cheap: class toggles and scrubbed
 * transforms. No layout is read inside a frame callback.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './motion-tokens';

gsap.registerPlugin(ScrollTrigger);

/** Corner labels appear once the hero is behind you and retire at the footer. */
function initCorners(): void {
  const corners = document.querySelector<HTMLElement>('[data-corners]');
  // `[data-hero]`, not `header` — the document's <header> is the fixed nav now.
  const hero = document.querySelector('[data-hero]');
  const footer = document.querySelector('footer');
  if (!corners || !hero) return;

  const clocks = Array.from(corners.querySelectorAll<HTMLElement>('[data-corner-clock]')).map(
    (el) => ({
      el,
      fmt: new Intl.DateTimeFormat('en-GB', {
        timeZone: el.dataset.cornerClock as string,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    })
  );

  let timer = 0;
  const tickClocks = () => {
    const now = new Date();
    clocks.forEach(({ el, fmt }) => {
      el.textContent = fmt.format(now);
    });
  };

  let pastHero = false;
  let atFooter = false;
  const apply = () => {
    const visible = pastHero && !atFooter;
    corners.classList.toggle('is-visible', visible);
    // A ticking clock nobody can see is just battery.
    if (visible && !timer) {
      tickClocks();
      timer = window.setInterval(tickClocks, 1000);
    } else if (!visible && timer) {
      window.clearInterval(timer);
      timer = 0;
    }
  };

  ScrollTrigger.create({
    trigger: hero,
    start: 'bottom 85%',
    onToggle: (self) => {
      pastHero = self.isActive || self.progress >= 1;
      apply();
    },
    onUpdate: (self) => {
      pastHero = self.progress > 0;
      apply();
    },
  });

  if (footer) {
    ScrollTrigger.create({
      trigger: footer,
      start: 'top bottom',
      onToggle: (self) => {
        atFooter = self.isActive;
        apply();
      },
    });
  }
}

/** The guide's portrait drifts against its own frame — a few percent, no more. */
function initGuideParallax(): void {
  const section = document.querySelector<HTMLElement>('#guida');
  const img = section?.querySelector<HTMLElement>('img');
  if (!section || !img) return;

  // Overscan first — the drift has to stay inside the frame at both extremes.
  gsap.set(img, { scale: 1.12 });
  gsap.fromTo(
    img,
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    }
  );
}

/** Generic once-only child stagger: any [data-stagger] group's children rise in. */
function initStaggerReveals(): void {
  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
    const items = Array.from(group.children) as HTMLElement[];
    if (!items.length) return;
    // Pre-hide in JS, not CSS — a failed init must never leave content hidden.
    gsap.set(items, { y: 24, autoAlpha: 0 });
    gsap.to(items, {
      y: 0,
      autoAlpha: 1,
      duration: 0.7,
      ease: 'vpOut',
      stagger: 0.08,
      clearProps: 'all',
      scrollTrigger: { trigger: group, start: 'top 80%', once: true },
    });
  });
}

/** The descent rail: each gutter segment draws itself as its section crosses. */
function initRouteRail(): void {
  gsap.utils.toArray<HTMLElement>('[data-route-seg]').forEach((seg) => {
    // Pre-hide in JS, not CSS — a failed init must never hide the line.
    gsap.set(seg, { scaleY: 0, transformOrigin: 'top center' });
    gsap.to(seg, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: seg.parentElement,
        start: 'top 85%',
        end: 'bottom 60%',
        scrub: 0.6,
      },
    });
  });
}

export function initSpatial(): void {
  initCorners();
  initGuideParallax();
  initStaggerReveals();
  initRouteRail();
}
