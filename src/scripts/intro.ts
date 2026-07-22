/**
 * Drives the opening overlay: the altimeter counting 304 → 0, the two city
 * clocks, the ruler playhead, and the lift that hands the screen to the hero.
 *
 * No GSAP on purpose — this runs before the idle boot, so it stays a couple of
 * kilobytes of rAF. The gate that decides whether any of it happens lives
 * inline in IntroLoader.astro; by the time this module runs the decision is
 * already recorded on <html>.
 */

/** Landscape master is 6.04s, portrait 5.04s — at 2× they land on these. */
const DURATION_LANDSCAPE = 3000;
const DURATION_PORTRAIT = 2500;
const ALTITUDE_TOP = 304;

export function initIntro(): void {
  const root = document.getElementById('intro');
  if (!root || !document.documentElement.classList.contains('intro-pending')) return;

  const portrait = window.matchMedia('(max-aspect-ratio: 3/4)').matches;
  const duration = portrait ? DURATION_PORTRAIT : DURATION_LANDSCAPE;

  const video = root.querySelector<HTMLVideoElement>('[data-intro-video]');
  const count = root.querySelector<HTMLElement>('[data-intro-count]');
  const playhead = root.querySelector<HTMLElement>('[data-intro-playhead]');
  const clocks = Array.from(root.querySelectorAll<HTMLElement>('[data-intro-clock]'));

  /* ---- the two cities ---------------------------------------------------- */
  const formatters = clocks.map((el) => {
    const timeZone = el.dataset.introClock as string;
    return {
      el,
      fmt: new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    };
  });
  const tickClocks = () => {
    const now = new Date();
    formatters.forEach(({ el, fmt }) => {
      el.textContent = fmt.format(now);
    });
  };
  tickClocks();
  const clockTimer = window.setInterval(tickClocks, 1000);

  /* ---- the reveal itself ------------------------------------------------- */
  if (video) {
    const src = portrait ? video.dataset.srcPortrait : video.dataset.srcLandscape;
    if (src) {
      // Spray paint at double speed reads as energy rather than a slow demo,
      // and fits the whole reveal inside three seconds.
      video.playbackRate = 2;
      video.src = src;
      // Rejected autoplay is survivable: the HUD still runs over the dark
      // ground and the lift happens on schedule either way.
      video.play().catch(() => {});
    }
  }

  /* ---- the instrument panel ---------------------------------------------- */
  let done = false;
  let raf = 0;
  const start = performance.now();
  let lastAltitude = -1;

  const frame = (now: number) => {
    const p = Math.min(1, (now - start) / duration);

    const altitude = Math.round(ALTITUDE_TOP * (1 - p));
    if (count && altitude !== lastAltitude) {
      count.textContent = String(altitude);
      lastAltitude = altitude;
    }
    if (playhead) playhead.style.left = `${p * 100}%`;

    if (p < 1) raf = requestAnimationFrame(frame);
    else finish(false);
  };
  raf = requestAnimationFrame(frame);

  /* ---- handing over ------------------------------------------------------ */
  function finish(skipped: boolean): void {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    window.clearInterval(clockTimer);
    document.removeEventListener('keydown', onKey);

    if (skipped) root!.classList.add('is-skipped');
    root!.classList.add('is-done');

    const settle = () => {
      root!.hidden = true;
      document.documentElement.classList.remove('intro-pending');
      window.dispatchEvent(new CustomEvent('vp:intro-done'));
    };
    root!.addEventListener('transitionend', settle, { once: true });
    // transitionend never fires if the element is hidden by other means.
    window.setTimeout(settle, skipped ? 600 : 900);
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') finish(true);
  }

  root.addEventListener('click', () => finish(true));
  document.addEventListener('keydown', onKey);
}
