/**
 * The site's motion vocabulary — four curves, shared by GSAP and CSS.
 *
 * The same beziers exist as `--ease-vp*` custom properties in global.css, so a
 * CSS hover transition and a scrubbed GSAP tween move on identical curves and
 * the whole page reads as one system. Change a curve here, change it there.
 *
 * CustomEase accepts the 4-number form as cubic-bezier control points between
 * (0,0) and (1,1) — the same semantics as CSS `cubic-bezier()`.
 */
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

/** Primary — symmetric drive. Curtains, wipes, decisive moves. */
CustomEase.create('vp', '0.65,0,0.35,1');
/** Reveals — fast out, long settle. Text rising into place, image scale. */
CustomEase.create('vpOut', '0.22,1,0.36,1');
/** Expo — the most confident settle; reserved for hero-scale moments. */
CustomEase.create('vpExpo', '0.16,1,0.3,1');
/** In-out quart — heavy section transitions. */
CustomEase.create('vpInOut', '0.76,0,0.24,1');

export const DUR = {
  micro: 0.2,
  reveal: 0.8,
  curtain: 1,
  drift: 1.8,
} as const;

/** Per-character delay in masked heading reveals. */
export const STAGGER_CHARS = 0.035;

/** Glyph pool for decode/scramble effects — HUD punctuation, no letters. */
export const SCRAMBLE_CHARS = '!<>-_/[]{}—=+*^?#0123456789';
