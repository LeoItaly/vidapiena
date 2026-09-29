/**
 * The one place that knows how to address a Bókun booking widget.
 *
 * The channel takes FULL PAYMENT ONLINE (29/09/2026): PayPal Complete Payments
 * is the payment provider and pay-on-arrival is off, so the seat is confirmed
 * only once the visitor has paid (PayPal or card). Still no OTA commission, and
 * availability stays in sync with Viator (and, once connected, GetYourGuide)
 * through Bókun. The provider may redirect the whole page and come back with
 * ?bookingId&bookingHash — src/scripts/bokun.ts handles both halves.
 *
 * The channel UUID is a PUBLIC identifier — it ships in the page HTML of every
 * Bókun embed on the web and is not a secret.
 *
 * ## Why we embed the URL ourselves instead of using BokunWidgetsLoader.js
 *
 * The official loader is a third-party script that runs on our page: it injects
 * a floating cart bubble and its own checkout modal (which would sit behind our
 * native <dialog> and be inert). We embed the URL ourselves for zero third-party
 * JS until the visitor asks for the calendar and no injected chrome.
 *
 * ⚠ A plain <iframe> is NOT enough, despite the 06/09 note that said so — that
 * was verified with the widget opened STANDALONE, where it runs its own
 * checkout. Embedded, the widget hands the checkout to the parent page and waits
 * for an answer, so a site with no answer left every visitor stuck at "Vai al
 * carrello" (found 13/09/2026). src/scripts/bokun.ts now plays the parent's half
 * of that protocol; read its header before changing how the frame is mounted.
 *
 * ## lang / currency
 *
 * Both query parameters are honoured by the widget (verified live 06/09/2026:
 * `?lang=it` renders "Partecipanti / Scegli una data / Settembre 2026", and
 * `?currency=EUR` renders the prices in €). We pass both so the calendar speaks
 * the page's language. Currency is pinned to BRL (see BOKUN_CURRENCY).
 *
 * ⚠ The widget's € is a LIVE conversion of the product's BRL price, while the
 * site's € is the fixed authored twin in tours.ts (kept at or above the
 * platforms' live conversion — see the rate-parity note there). The two agree
 * only while the Bókun product carries the same BRL price the site was priced
 * from. If a product's BRL price drifts, the calendar and the panel beside it
 * will quote different euro figures.
 */
import type { Locale } from '../i18n';

/** Booking channel "Default Channel" (427386) — public identifier, not a secret. */
export const BOKUN_CHANNEL_UUID = 'd72739bc-dacd-4937-ba51-5d79fbfce9cb';

/** BRL, not the site's €: since the PayPal switch (29/09/2026) this is the
 *  currency the visitor is CHARGED in, and Francesco settles in R$ — charging €
 *  would cost him PayPal's conversion spread. The visitor's own PayPal/card does
 *  the conversion instead (client decision: favour Francesco). The calendar note
 *  in i18n tells the visitor the payment is in reais. */
const BOKUN_CURRENCY = 'BRL';

/** Availability calendar for one experience, in the page's language and currency. */
export function bokunCalendarSrc(bokunId: number, locale: Locale): string {
  const base = `https://widgets.bokun.io/online-sales/${BOKUN_CHANNEL_UUID}/experience-calendar/${bokunId}`;
  return `${base}?lang=${locale}&currency=${BOKUN_CURRENCY}`;
}
