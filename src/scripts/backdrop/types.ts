/**
 * The seam between the descent's scroll logic and its visual backend.
 *
 * v1: LayeredPhotoBackdrop (photo crossfades + parallax + color grade) — permanent,
 *     doubles as the fallback layer.
 * v2 (post clip-shoot): FrameSequenceBackdrop — canvas scrubbing of the 5 chained
 *     Seedance clips. Swapping backends = one import change in descent.ts; sections,
 *     HUD and copy never change.
 */
export interface BackdropRenderer {
  init(root: HTMLElement): void | Promise<void>;
  /** progress ∈ [0, 1] across the whole descent (already scrub-smoothed). */
  render(progress: number): void;
  destroy(): void;
}
