/**
 * Mounts the Bókun availability calendar — inline in the tour-page rail, and in
 * the shared modal that every "see the dates" trigger opens — and plays the
 * parent-page half of the widget's checkout protocol.
 *
 * Loaded outside the motion gate (main.ts) on purpose: the modal is a booking
 * path, not a decoration, so it must work for reduced-motion and Save-Data
 * visitors too. Nothing is fetched from bokun.io until the visitor scrolls the
 * rail into view or opens the modal.
 *
 * ## The widget expects a parent page that answers it (13/09/2026)
 *
 * The Bókun widget is built to run under its own loader script, and an embedded
 * calendar does NOT open the checkout itself. Traced live on riovidapiena.com:
 *
 * 1. It runs behind iframe-resizer (announces `[iFrameResizerChild]Ready`) and
 *    expects the parent to grow the frame to its content height.
 * 2. "Prenota" adds the tour to a server-side cart keyed by `bokunSessionId`,
 *    then asks the PARENT to open the checkout:
 *    `OpenModalRequest { src: "/<channel>/checkout", openFrom: "checkoutButton" }`.
 *    The button turns into "Vai al carrello" and every later click re-sends the
 *    same request. With nobody answering, the visitor is stuck there and never
 *    sees the contact form — the bug Leo hit twice.
 * 3. The checkout only finds that cart when it is loaded with the SAME
 *    `bokunSessionId` AND `isModal=true`. Without the session it says "Il
 *    carrello è vuoto"; without `isModal` it loads but shows the empty cart
 *    too. Both verified in a real browser, cart add → contact form.
 *
 * Bókun's loader does all of that, but it also injects a floating cart bubble and
 * its own modal — which would sit BEHIND our native <dialog> (top layer) and be
 * inert. So we ship only the two pieces the protocol needs: the iframe-resizer
 * host (self-bundled, MIT) and the handful of messages below.
 */
import iframeResize from 'iframe-resizer/js/iframeResizer.js';

const BOKUN_ORIGIN = 'https://widgets.bokun.io';

/** Below this the rail's inline calendar is never mounted — the modal is used
 *  instead. A ~1300px foreign iframe inline on a phone is not a booking flow.
 *  Matches the `lg:` breakpoint the rail layout uses. */
const INLINE_FROM = '(min-width: 64rem)';

/** One cart per page view, shared by every frame on the page, so a tour added in
 *  the rail calendar is still in the cart when the checkout opens in the modal.
 *  Bókun only checks that it is a string; its server keeps the cart ~20 min. */
const SESSION_ID = newSessionId();

function newSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // randomUUID needs a secure context and Safari 15.4+.
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }
}

/** A widget URL carrying this page's cart session (plus any extra params). */
function widgetUrl(src: string, extra: Record<string, string> = {}): string {
  const url = new URL(src, BOKUN_ORIGIN);
  url.searchParams.set('bokunSessionId', SESSION_ID);
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  return url.toString();
}

function mountFrame(host: HTMLElement, src: string, title: string): void {
  if (host.dataset.bokunMounted === src) return;
  host.querySelector('iframe')?.remove();
  host.classList.remove('is-loaded');
  host.scrollTop = 0;

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

  // Grow the frame to the widget's own content height so the checkout is
  // reachable, and listen for the widget's requests (see the header note).
  // checkOrigin is pinned to the widget origin — the frame only ever loads
  // widgets.bokun.io — and 'lowestElement' survives the widget swapping the
  // calendar for the taller checkout without leaving the frame at the old height.
  iframeResize(
    {
      checkOrigin: [BOKUN_ORIGIN],
      heightCalculationMethod: 'lowestElement',
      log: false,
      onMessage: onWidgetMessage,
    },
    frame,
  );
}

/* --- the widget's requests to the parent page ----------------------------- */

interface WidgetMessage {
  messageType?: string;
  options?: { src?: unknown; openFrom?: unknown };
  url?: unknown;
}

/** The widget double-encodes: iframe-resizer JSON.parses the body once and gets
 *  back the JSON string the widget stringified. Accept either shape. */
function parseMessage(message: unknown): WidgetMessage | null {
  try {
    const data = typeof message === 'string' ? JSON.parse(message) : message;
    return data && typeof data === 'object' ? (data as WidgetMessage) : null;
  } catch {
    return null;
  }
}

/** The checkout URL for an OpenModalRequest — same rules as Bókun's loader
 *  (relative src under /online-sales, absolute for booking buttons) — or null for
 *  anything that would leave the widget origin. */
function checkoutUrl(options: WidgetMessage['options'], from: HTMLIFrameElement): string | null {
  if (!options || typeof options.src !== 'string') return null;
  const absolute = options.openFrom === 'bookingButton' || options.openFrom === 'onlineSalesLink';
  let url: URL;
  try {
    url = new URL(absolute ? options.src : `${BOKUN_ORIGIN}/online-sales${options.src}`);
  } catch {
    return null;
  }
  if (url.origin !== BOKUN_ORIGIN) return null;

  // Keep the language and currency the calendar was opened in.
  const extra: Record<string, string> = { isModal: 'true' };
  try {
    const params = new URL(from.src).searchParams;
    for (const key of ['lang', 'currency']) {
      const value = params.get(key);
      if (value) extra[key] = value;
    }
  } catch {
    // A frame without a parseable src just gets the widget defaults.
  }
  return widgetUrl(url.toString(), extra);
}

function onWidgetMessage({ iframe, message }: { iframe: HTMLIFrameElement; message: unknown }): void {
  const data = parseMessage(message);
  switch (data?.messageType) {
    case 'OpenModalRequest': {
      const url = checkoutUrl(data.options, iframe);
      if (url) openInDialog(url, iframe.closest<HTMLElement>('[data-bokun-name]')?.dataset.bokunName);
      break;
    }
    case 'CloseModalRequest':
      document.querySelector<HTMLDialogElement>('[data-bokun-dialog]')?.close();
      break;
    case 'OpenPopupModal':
      // Used by Bókun for payment-provider windows. The channel takes no
      // payments today (pay on arrival), but never swallow it if that changes.
      if (typeof data.url === 'string' && data.url.startsWith('https://')) {
        window.open(data.url, '_blank', 'noopener');
      }
      break;
    // PaymentRedirect is not handled: full payments and deposits are both off on
    // this channel (see lib/bokun.ts). Revisit if card payments are ever enabled.
  }
}

/** Show a widget URL in the shared modal, opening it if needed. */
function openInDialog(src: string, name?: string): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-bokun-dialog]');
  const host = dialog?.querySelector<HTMLElement>('[data-bokun-dialog-frame]');

  // No <dialog> support (iOS < 15.4): the widget is a real page and the cart
  // travels in the URL, so send the visitor straight to it.
  if (!dialog || !host || typeof dialog.showModal !== 'function') {
    window.open(src, '_blank', 'noopener');
    return;
  }

  const title = dialog.querySelector<HTMLElement>('[data-bokun-dialog-title]');
  if (title && name) title.textContent = name;

  mountFrame(host, src, name ?? title?.textContent ?? 'Bókun');
  if (!dialog.open) dialog.showModal();
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
        if (src) mountFrame(host, widgetUrl(src), host.dataset.bokunTitle ?? 'Bókun');
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

    event.preventDefault();
    if (waLink && trigger.dataset.bokunWa) waLink.href = trigger.dataset.bokunWa;
    openInDialog(widgetUrl(src), trigger.dataset.bokunName);
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
