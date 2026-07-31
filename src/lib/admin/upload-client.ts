/**
 * Browser-side: take a file off the phone, shrink it, send it, and say what
 * happened in a sentence Francesco can act on.
 *
 * Shared by /admin/foto and by the block editor so the two cannot drift — the
 * error wording in particular, which is the part that was wrong.
 *
 * ## The failure that mattered
 *
 * The first version wrapped the whole thing in one try/catch and reported every
 * throw as *"Non riesco ad aprire questa foto. Provane un'altra."* But `fetch`
 * rejecting is not a broken photo — it is a dropped connection, which in Rio is
 * the single most likely failure. Verified by driving the real handler with a
 * rejecting fetch: the screen told him to pick a different photo, so he would
 * work through his entire camera roll while the network stayed down.
 *
 * A 401 was worse: the middleware's internal reason code rendered verbatim, so
 * the page literally read `non-autenticato` — not Italian, not actionable — with
 * the thumbnail beside it, which reads as success.
 */

import { processPhoto, PhotoError, type ProcessedPhoto } from './photo-process';

export type UploadOutcome =
  | { esito: 'ok'; id: string; foto: ProcessedPhoto }
  /** Something about this file. Picking another one is the right advice. */
  | { esito: 'foto'; messaggio: string }
  /** The network. The photo is fine; retrying later is the right advice. */
  | { esito: 'rete'; messaggio: string }
  /** The session died. Nothing will work until he logs in again. */
  | { esito: 'sessione'; messaggio: string }
  /** The server refused or is unavailable, and said why in Italian. */
  | { esito: 'server'; messaggio: string };

const MESSAGGI = {
  rete: 'Connessione persa: la foto non è stata salvata. La riprovo quando torni online — non serve cambiare foto.',
  sessione: 'Il collegamento è scaduto. Tocca «Entra» qui sotto e ricarica: il testo resta salvato.',
  server: 'Non riesco a salvare la foto in questo momento. Riprova fra poco.',
  foto: 'Non riesco ad aprire questa foto. Provane un’altra.',
} as const;

export interface UploadFields {
  bozza: string;
  alt?: string;
  didascalia?: string;
}

/**
 * Runs the pipeline and the upload, mapping every failure onto one of four
 * outcomes. Never throws: the caller renders `messaggio` directly.
 */
export async function processAndUpload(
  file: File,
  fields: UploadFields,
  onStage?: (stage: 'preparo' | 'carico') => void,
): Promise<UploadOutcome> {
  let foto: ProcessedPhoto;
  try {
    onStage?.('preparo');
    foto = await processPhoto(file);
  } catch (err) {
    // Only this half is genuinely about the file.
    return {
      esito: 'foto',
      messaggio: err instanceof PhotoError ? err.italiano : MESSAGGI.foto,
    };
  }

  const body = new FormData();
  body.append('foto', foto.blob, 'foto.jpg');
  body.append('bozza', fields.bozza);
  if (fields.alt) body.append('alt', fields.alt);
  if (fields.didascalia) body.append('didascalia', fields.didascalia);

  let res: Response;
  try {
    onStage?.('carico');
    res = await fetch('/admin/api/foto', { method: 'POST', body });
  } catch {
    // fetch rejects only for network-level failures — exactly the case the old
    // code blamed on the photo.
    return { esito: 'rete', messaggio: MESSAGGI.rete };
  }

  if (res.status === 401 || res.status === 403) {
    return { esito: 'sessione', messaggio: MESSAGGI.sessione };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string; errore?: string };

  if (!res.ok) {
    // 4xx bodies are written in Italian for him; 5xx may not be.
    const serverSaid = typeof data.errore === 'string' && /\s/.test(data.errore) ? data.errore : '';
    return {
      esito: res.status >= 500 ? 'server' : 'foto',
      messaggio: serverSaid || MESSAGGI.server,
    };
  }

  if (!data.id) return { esito: 'server', messaggio: MESSAGGI.server };

  return { esito: 'ok', id: data.id, foto };
}

/** `1,2 MB` / `380 KB` — Italian decimal comma, because he reads this. */
export function pesoLeggibile(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
