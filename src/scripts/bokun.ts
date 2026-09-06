/**
 * Mounts the Bókun availability calendar — inline in the tour-page rail, and in
 * the shared modal that every "see the dates" trigger opens.
 *
 * Loaded outside the motion gate (main.ts) on purpose: the modal is a booking
 * path, not a decoration, so it must work for reduced-motion and Save-Data
 * visitors too. It ships no third-party script — the widget is a plain iframe
 * (see src/lib/bokun.ts for why) — and nothing is fetched from bokun.io until
 * the visitor scrolls the rail into view or opens the modal.
 */

/** Below this the rail's inline calendar is never mounted — the modal is used
 *  instead. A ~1300px foreign iframe inline on a phone is not a booking flow.
 *  Matches the `lg:` breakpoint the rail layout uses. */
const INLINE_FROM = '(min-width: 64rem)';

function mountFrame(host: HTMLElement, src: string, title: string): void {
  if (host.dataset.bokunMounted === src) return;
  host.querySelector('iframe')?.remove();
  host.classList.remove('is-loaded');

  const frame = document.createElement('iframe');
  frame.title = title;
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.addEventListener('load', () => host.classList.add('is-loaded'), { once: true });
  frame.src = src;

  // appendChild, not append: workerd's HTMLRewriter Element.append() shadows
  // the DOM signature in this project's types (same trap as the global Element).
  host.appendChild(frame);
  host.dataset.bokunMounted = src;
}

/* --- the inline rail calendar ------------------------------------------- */

function initInline(): void {
  const hosts = document.querySelectorAll<HTMLElement>('[data-bokun-inline]');
  if (!hosts.length) return;

  const wide = window.matchMedia(INLINE_FROM);
  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const host = entry.target as HTMLElement;
        const src = host.dataset.bokunSrc;
        if (src) mountFrame(host, src, host.dataset.bokunTitle ?? 'Bókun');
        obs.unobserve(host);
      }
    },
    // Start the fetch a screen early: the visitor is reading the description
    // above it, so the calendar is ready by the time the rail is in view.
    { rootMargin: '600px 0px' },
  );

  const sync = (): void => {
    for (const host of hosts) {
      if (wide.matches) observer.observe(host);
      else observer.unobserve(host);
    }
  };
  sync();
  // A phone rotated to landscape (or a resized desktop window) crosses the
  // breakpoint; mount then rather than leaving an empty frame behind.
  wide.addEventListener('change', sync);
}

/* --- the shared modal ---------------------------------------------------- */

function initDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-bokun-dialog]');
  const host = dialog?.querySelector<HTMLElement>('[data-bokun-dialog-frame]');
  const title = dialog?.querySelector<HTMLElement>('[data-bokun-dialog-title]');
  const waLink = dialog?.querySelector<HTMLAnchorElement>('[data-bokun-dialog-wa]');

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest('[data-bokun-close]')) {
      dialog?.close();
      return;
    }

    const trigger = target.closest<HTMLElement>('[data-bokun-open]');
    if (!trigger) return;

    const src = trigger.dataset.bokunSrc;
    if (!src) return;

    // No <dialog> support (iOS < 15.4): the widget is a real page, so send the
    // visitor straight to it rather than swallowing the click.
    if (!dialog || !host || typeof dialog.showModal !== 'function') {
      window.open(src, '_blank', 'noopener');
      return;
    }

    event.preventDefault();
    const name = trigger.dataset.bokunName ?? '';
    if (title) title.textContent = name;
    if (waLink && trigger.dataset.bokunWa) waLink.href = trigger.dataset.bokunWa;

    mountFrame(host, src, trigger.dataset.bokunTitle ?? name);
    dialog.showModal();
  });

  if (!dialog) return;

  // Click on the backdrop — i.e. on the dialog element itself, outside the panel.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function init(): void {
  try {
    initInline();
  } catch (err) {
    console.error('[vp] bokun inline init failed', err);
  }
  try {
    initDialog();
  } catch (err) {
    console.error('[vp] bokun dialog init failed', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
