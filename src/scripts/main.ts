/**
 * Motion gate — the only script loaded on every page view.
 * The page is complete and readable before (and without) anything here running:
 * GSAP + the video stream are progressive enhancement, imported at idle,
 * and skipped entirely for reduced-motion / Save-Data / 2G visitors.
 */

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

function motionAllowed(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = (navigator as { connection?: NetworkInformation }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && ['slow-2g', '2g'].includes(conn.effectiveType)) return false;
  return true;
}

function boot(): void {
  Promise.all([
    import('./hero-video'),
    import('./tours-grid'),
    import('./text-reveals'),
    import('./marquees'),
    import('./spatial'),
    import('./nav'),
  ])
    .then(([hero, grid, texts, marquees, spatial, nav]) => {
      // Flip first so every gated presentation switches atomically, then init
      // after the layout settles, then re-measure triggers.
      document.documentElement.classList.add('motion-ok');
      requestAnimationFrame(() => {
        // Isolated per module: one failed init must not strand the ones after
        // it in a half-applied motion layout (a stranded marquee — .motion-ok
        // styles with no engine — reads exactly like a deleted carousel).
        const inits: Array<[string, () => void]> = [
          ['tours-grid', grid.initToursGrid],
          ['hero-video', hero.initHeroVideo],
          // Waits on document.fonts internally — splitting early mis-measures.
          ['text-reveals', texts.initTextReveals],
          ['marquees', marquees.initMarquees],
          ['spatial', spatial.initSpatial],
          ['nav', nav.initNav],
        ];
        for (const [name, init] of inits) {
          try {
            init();
          } catch (err) {
            console.error(`[vp] ${name} init failed`, err);
          }
        }
      });

      // The boot can land mid-intro, with the scroll still locked. Re-measure
      // once the overlay lifts and the page is its real height again.
      if (document.documentElement.classList.contains('intro-pending')) {
        window.addEventListener('vp:intro-done', () => texts.refreshTriggers(), { once: true });
      }
    })
    .catch(() => {
      // Import failed (offline, blocked) — restore the static path.
      document.documentElement.classList.remove('motion-ok');
    });
}

/* Verification hook, opt-in via ?vpdebug=1: exposes the bundled GSAP so a test
   harness can drive the clock by hand (gsap.updateRoot). Costs nothing without
   the query param, and works on the static path too. */
if (new URLSearchParams(window.location.search).has('vpdebug')) {
  Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, st]) => {
    (window as unknown as { __vp?: object }).__vp = {
      gsap: g.default,
      ScrollTrigger: st.ScrollTrigger,
    };
  });
}

if (motionAllowed()) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(boot, { timeout: 2000 });
  } else {
    setTimeout(boot, 300);
  }

  // If the user enables reduced motion mid-visit, a reload is the cleanest
  // way back to the static path (rare event, state is only scroll position).
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', (e) => e.matches && window.location.reload());
}
