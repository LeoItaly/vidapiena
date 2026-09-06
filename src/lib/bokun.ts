/**
 * The one place that knows how to address a Bókun booking widget.
 *
 * The channel is configured for PAY ON ARRIVAL (full payments and deposits both
 * off), so every widget here is a REQUEST to book, not a checkout: the visitor
 * picks a date and sends the request, Francesco confirms and collects the money
 * directly. That keeps the 19/08 direct-booking decision intact — no card fees,
 * no OTA commission — while availability stays in sync with Viator (and, once
 * connected, GetYourGuide) through Bókun.
 *
 * The channel UUID is a PUBLIC identifier — it ships in the page HTML of every
 * Bókun embed on the web and is not a secret.
 *
 * ## Why we embed the URL ourselves instead of using BokunWidgetsLoader.js
 *
 * The official loader is a third-party script that runs on our page: it injects
 * a floating cart bubble, sizes the iframe by postMessage, and has to be present
 * before the widget mounts. Verified live on 06/09/2026 that the widget URL
 * works standalone end to end — calendar → time slot → booking summary →
 * /checkout/main-contact — so a plain <iframe> is enough. That buys three
 * things the loader cannot: zero third-party JS until the visitor asks for the
 * calendar, no injected floating chrome, and full control of the frame's size.
 *
 * ## lang / currency
 *
 * Both query parameters are honoured by the widget (verified live 06/09/2026:
 * `?lang=it` renders "Partecipanti / Scegli una data / Settembre 2026", and
 * `?currency=EUR` renders the prices in €). We pass both so the calendar speaks
 * the page's language and quotes the page's currency instead of defaulting to
 * English + BRL.
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

/** Match the site, which shows € to every visitor (client decision 01/09/2026). */
const BOKUN_CURRENCY = 'EUR';

/** Availability calendar for one experience, in the page's language and currency. */
export function bokunCalendarSrc(bokunId: number, locale: Locale): string {
  const base = `https://widgets.bokun.io/online-sales/${BOKUN_CHANNEL_UUID}/experience-calendar/${bokunId}`;
  return `${base}?lang=${locale}&currency=${BOKUN_CURRENCY}`;
}
