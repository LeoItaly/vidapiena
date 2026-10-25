/** riovidapiena.com/wa → WhatsApp with the Italian Instagram prefill. See lib/instagram-wa.ts. */
export const prerender = false;

import { instagramWaRedirect } from '../lib/instagram-wa';

export const GET = instagramWaRedirect('it');
