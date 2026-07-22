/**
 * The written layer: headings rise out of a mask one character at a time, mono
 * labels decode out of noise, and the spray strokes paint themselves on.
 *
 * Everything here is additive. The page ships complete and readable; nothing
 * hides text before JS runs, and the split only happens once the fonts have
 * settled so characters are measured at their final metrics.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { DUR, STAGGER_CHARS, SCRAMBLE_CHARS } from './motion-tokens';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin);

/**
 * Headings that live inside a pinned/sticky container can't trigger off their
 * own box — it stops moving. They carry `data-reveal-trigger` pointing at the
 * scrolling section instead.
 */
function triggerFor(el: HTMLElement): Element {
  const sel = el.dataset.revealTrigger;
  return (sel && document.querySelector(sel)) || el;
}

/** Masked per-character rise — the signature heading move. */
function revealHeadings(): void {
  gsap.utils.toArray<HTMLElement>('[data-reveal-heading]').forEach((el) => {
    const split = SplitText.create(el, {
      type: 'words,chars',
      mask: 'chars',
      // The graffiti underline is an SVG child of the heading — never split it.
      ignore: '.spray-stroke',
    });
    if (!split.chars.length) return;

    gsap.from(split.chars, {
      yPercent: 110,
      duration: DUR.reveal,
      ease: 'vpOut',
      stagger: STAGGER_CHARS,
      scrollTrigger: {
        trigger: triggerFor(el),
        start: 'top 80%',
        // Replays whichever way you arrive, and re-arms once it's fully past —
        // the heading is never caught frozen mid-rise.
        toggleActions: 'restart none restart reset',
      },
    });
  });
}

/** Mono labels resolve out of noise, once, as they arrive. */
function scrambleLabels(): void {
  gsap.utils.toArray<HTMLElement>('[data-scramble]').forEach((el) => {
    const text = (el.textContent || '').trim();
    if (!text) return;
    // The readable string is pinned to the element before a single glyph
    // churns, so assistive tech never sees the noise.
    el.setAttribute('aria-label', text);

    gsap.to(el, {
      duration: 0.7,
      delay: 0.15,
      ease: 'none',
      scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.4 },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/** Links re-decode on hover — the same device, used as feedback. */
function scrambleOnHover(): void {
  gsap.utils.toArray<HTMLElement>('[data-scramble-hover]').forEach((el) => {
    const text = (el.textContent || '').trim();
    if (!text) return;
    el.setAttribute('aria-label', text);

    let tween: gsap.core.Tween | undefined;
    el.addEventListener('mouseenter', () => {
      tween?.kill();
      tween = gsap.to(el, {
        duration: 0.5,
        ease: 'none',
        scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5 },
      });
    });
  });
}

/** The one graffiti device, painted rather than pasted. */
function drawSprayStrokes(): void {
  gsap.utils.toArray<SVGPathElement>('[data-spray] path').forEach((path) => {
    const heading = path.closest('[data-spray]')?.parentElement ?? path;
    gsap.from(path, {
      drawSVG: '0%',
      duration: 0.9,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
    });
  });
}

/** Re-measure after something outside this module changed the layout. */
export function refreshTriggers(): void {
  ScrollTrigger.refresh();
}

export function initTextReveals(): void {
  const run = () => {
    revealHeadings();
    scrambleLabels();
    scrambleOnHover();
    drawSprayStrokes();
    // Splitting rewrites the heading boxes — every other trigger on the page
    // measured against the pre-split layout.
    ScrollTrigger.refresh();
  };

  // Splitting before the display face lands measures the fallback font and
  // leaves characters at the wrong widths.
  if (document.fonts?.status === 'loaded') run();
  else document.fonts.ready.then(run);
}
