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
  Promise.all([import('./descent'), import('./hero-video')])
    .then(([descent, hero]) => {
      // Flip first so backdrop/figures/HUD switch atomically, then init after
      // the layout settles, then re-measure triggers.
      document.documentElement.classList.add('motion-ok');
      requestAnimationFrame(() => {
        descent.initDescent();
        hero.initHeroVideo();
      });
    })
    .catch(() => {
      // Import failed (offline, blocked) — restore the static path.
      document.documentElement.classList.remove('motion-ok');
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
