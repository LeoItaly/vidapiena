import gsap from 'gsap';
import type { BackdropRenderer } from './types';

const ZONE_COUNT = 5;
/** Fraction of a zone band used to crossfade into the next layer. */
const FADE = 0.3;

/**
 * v1 backend: the 5 stacked zone layers crossfade while each layer's image
 * drifts slowly (scale + y) for depth. Implemented as a single PAUSED timeline;
 * `render(p)` scrubs it via `.progress(p)` — write-only, no layout reads.
 */
export class LayeredPhotoBackdrop implements BackdropRenderer {
  private tl: gsap.core.Timeline | null = null;

  init(root: HTMLElement): void {
    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-zone-layer]'));
    if (layers.length !== ZONE_COUNT) return;

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

    // Later layers sit above earlier ones, so fading a layer IN fully covers
    // the previous — no fade-outs needed. Layer 0 starts visible (CSS default,
    // made explicit here so inline style wins over the stylesheet).
    gsap.set(layers[0], { opacity: 1 });
    gsap.set(layers.slice(1), { opacity: 0 });

    for (let i = 1; i < ZONE_COUNT; i++) {
      tl.to(layers[i], { opacity: 1, duration: FADE }, i - FADE);
    }

    // Slow drift on each layer's imagery across its active window.
    layers.forEach((layer, i) => {
      const img = layer.querySelector('img, div');
      if (!img) return;
      tl.fromTo(
        img,
        { scale: 1.12, yPercent: -3 },
        { scale: 1.02, yPercent: 3, duration: 1 + FADE },
        Math.max(0, i - FADE)
      );
    });

    // Normalize: progress(p) maps p∈[0,1] over the full descent.
    tl.duration(ZONE_COUNT);
    this.tl = tl;
  }

  render(progress: number): void {
    this.tl?.progress(progress);
  }

  destroy(): void {
    this.tl?.kill();
    this.tl = null;
  }
}
