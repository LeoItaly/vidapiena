import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

/**
 * Short links for Instagram: riovidapiena.com/wa (IT) and /en/wa (EN).
 *
 * Why they exist (25 Oct 2026): the long wa.me link in the Instagram automatic
 * reply showed up as plain text, not as a link — the customer would have had to
 * copy and paste it. A short URL with no `?`, `!` or `%20` fits in the 500-char
 * auto-reply with room to spare, and the same short link goes in Francesco's bio
 * ("Prenota qui"), so a future number change is one edit here instead of one on
 * Meta plus one in the Instagram app.
 *
 * ⚠️ The prefilled texts are the WhatsApp bot's entry pass: whatsapp-bot/src/entry.js
 * opens the chat to the bot only when the first message contains "ti scrivo da
 * instagram" / "writing from instagram". Change them there too, or the bot goes
 * silent for every Instagram customer.
 *
 * Server-rendered (not prerendered) so the response is a real 302 — a static
 * meta-refresh page would add a visible blank page inside Instagram's in-app
 * browser. 302 + no-store, not 301: browsers cache a 301 forever, which would pin
 * the old number after a change.
 */
const PREFILL = {
  it: 'Ciao! Ti scrivo da Instagram: vorrei informazioni sui tour a Rio.',
  en: "Hi! I'm writing from Instagram: I'd like info about your tours in Rio.",
} as const;

export function instagramWaRedirect(lang: keyof typeof PREFILL): APIRoute {
  return () =>
    new Response(null, {
      status: 302,
      headers: {
        Location: `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(PREFILL[lang])}`,
        'Cache-Control': 'no-store',
      },
    });
}
