import type { BackdropRenderer } from './types';

/**
 * v2 backend — STUB until the 5 Seedance clips are generated (post Higgsfield
 * Plus renewal, ~23 Jul 2026; see docs/PROMPT-3D-SCROLL.md).
 *
 * Planned implementation:
 *  1. Extract ~150–200 frames from the concatenated 5-clip descent (AVIF/WebP).
 *  2. `init()` mounts a <canvas> over the photo layers, lazy-loads frames after
 *     LCP in priority order (coarse set first, then fill), photo layer stays
 *     visible until enough frames are buffered.
 *  3. `render(p)` draws frame `Math.round(p * (N - 1))` — same smoothed p the
 *     photo backend receives today.
 *  4. `destroy()` removes the canvas; photo layers remain as instant fallback.
 *
 * Swap: in descent.ts, replace `new LayeredPhotoBackdrop()` with
 * `new FrameSequenceBackdrop()` (keep the photo backend as its internal fallback).
 */
export class FrameSequenceBackdrop implements BackdropRenderer {
  init(_root: HTMLElement): void {
    throw new Error('FrameSequenceBackdrop is not implemented yet — clips pending (M7).');
  }
  render(_progress: number): void {}
  destroy(): void {}
}
