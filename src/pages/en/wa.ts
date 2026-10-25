/** riovidapiena.com/en/wa → WhatsApp with the English Instagram prefill. See lib/instagram-wa.ts. */
export const prerender = false;

import { instagramWaRedirect } from '../../lib/instagram-wa';

export const GET = instagramWaRedirect('en');
