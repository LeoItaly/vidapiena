/**
 * Hero reveal video — streams in AFTER the poster (the LCP element) has painted.
 * The clip's final frame pixel-matches the poster, so ending on the last frame
 * is seamless; every failure path simply leaves the poster visible.
 */
export function initHeroVideo(): void {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video) return;

  const portrait = window.matchMedia('(max-aspect-ratio: 3/4)').matches;
  const src = portrait ? video.dataset.srcPortrait : video.dataset.srcLandscape;
  if (!src) return;

  video.addEventListener(
    'playing',
    () => {
      video.classList.add('is-playing');
    },
    { once: true }
  );

  video.src = src;
  // Autoplay can be rejected (iOS Low Power Mode, browser settings) — poster stays.
  video.play().catch(() => {});
}
