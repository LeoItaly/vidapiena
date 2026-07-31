/**
 * Everything that must be true before a single byte is committed.
 *
 * The deploy is gated on `astro check && astro build`. If an invalid article
 * reaches the repository the *deploy* fails — and a failed deploy surfaces as an
 * English stack trace in a GitHub Actions log, on a phone, to someone who cannot
 * read it and cannot revert it. So every condition that would break the build is
 * checked here, where the failure is an Italian sentence and nothing has changed
 * yet.
 *
 * Each message names the thing to fix, in his words, and no message contains a
 * field name from the schema.
 */

import type { Block } from './blocks';
import { referencedPhotoIds } from './blocks';
import { slugForTitle } from './slug';

export interface DraftLike {
  title: string;
  description: string;
  date: string;
  coverPhotoId: string;
  blocks: Block[];
  publishedSlug?: string;
}

export interface CheckContext {
  /** Photo ids currently stored against this draft. */
  fotoDisponibili: string[];
  /** Slugs already in src/content/blog/it (published articles). */
  slugEsistenti: string[];
}

export interface CheckResult {
  ok: boolean;
  /** Blocking. Italian, shown as a list. */
  errori: string[];
  /** Non-blocking, but worth saying before it is public. */
  avvisi: string[];
  slug: string;
}

/** Long enough to be a real description, short enough for a search result. */
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 200;
const TITLE_MIN = 10;

export function checkDraft(draft: DraftLike, ctx: CheckContext): CheckResult {
  const errori: string[] = [];
  const avvisi: string[] = [];

  const titolo = draft.title.trim();
  if (!titolo) errori.push('Manca il titolo.');
  else if (titolo.length < TITLE_MIN) errori.push('Il titolo è troppo corto per dire di cosa parli.');

  const riassunto = draft.description.trim();
  if (!riassunto) {
    errori.push('Manca il riassunto: è la frase che si legge su Google.');
  } else if (riassunto.length < DESCRIPTION_MIN) {
    avvisi.push('Il riassunto è molto corto. Su Google si vedrà quasi vuoto.');
  } else if (riassunto.length > DESCRIPTION_MAX) {
    avvisi.push('Il riassunto è lungo: Google ne mostrerà solo l’inizio.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || Number.isNaN(Date.parse(draft.date))) {
    errori.push('La data non è valida.');
  }

  /*
   * The slug is frozen at first publish and never recomputed, because it is the
   * live URL: recomputing it from an edited title would 404 every link he has
   * already shared. A collision is only possible on the FIRST publish.
   */
  const slug = draft.publishedSlug ?? slugForTitle(titolo, new Date(draft.date || Date.now()));
  if (!draft.publishedSlug && ctx.slugEsistenti.includes(slug)) {
    errori.push(
      'Hai già un articolo con questo indirizzo. Cambia un po’ il titolo — anche una parola basta.',
    );
  }

  const testuali = draft.blocks.filter(
    (b) => b.k !== 'foto' && ('testo' in b ? b.testo.trim() : b.voci.some((v) => v.trim())),
  );
  if (testuali.length === 0) errori.push('L’articolo è vuoto: scrivi almeno un paragrafo.');

  // Every photo must exist in THIS draft, or the committed markdown points at a
  // file that is not in the commit — and `astro:assets` fails the build on a
  // missing image rather than skipping it.
  const usate = referencedPhotoIds(draft.blocks);
  const mancanti = usate.filter((id) => id && !ctx.fotoDisponibili.includes(id));
  if (mancanti.length) {
    errori.push(
      mancanti.length === 1
        ? 'Una foto dell’articolo non c’è più. Aprila e riscegliela.'
        : `${mancanti.length} foto dell’articolo non ci sono più. Aprile e risceglile.`,
    );
  }

  const senzaFoto = draft.blocks.filter((b) => b.k === 'foto' && !b.fotoId).length;
  if (senzaFoto) {
    errori.push(
      senzaFoto === 1
        ? 'C’è un blocco Foto senza nessuna foto scelta.'
        : `Ci sono ${senzaFoto} blocchi Foto senza nessuna foto scelta.`,
    );
  }

  // Alt text is an accessibility requirement and it is also what Google reads.
  const senzaAlt = draft.blocks.filter((b) => b.k === 'foto' && b.fotoId && !b.alt.trim()).length;
  if (senzaAlt) {
    errori.push(
      senzaAlt === 1
        ? 'Una foto non ha la descrizione. Scrivi cosa si vede.'
        : `${senzaAlt} foto non hanno la descrizione. Scrivi cosa si vede.`,
    );
  }

  if (draft.coverPhotoId && !ctx.fotoDisponibili.includes(draft.coverPhotoId)) {
    errori.push('La foto di copertina non c’è più. Scegline un’altra.');
  }
  if (!draft.coverPhotoId) {
    avvisi.push('Non hai messo una foto di copertina: sul blog l’articolo apparirà senza immagine.');
  }

  return { ok: errori.length === 0, errori, avvisi, slug };
}

/**
 * The final gate, run on the exact bytes about to be committed.
 *
 * `checkDraft` validates intent; this validates the artefact. CRLF is the one
 * that looks pedantic and is not: `.gitattributes` pins `eol=lf`, and a CRLF in
 * a content file changes Vite's content hashes — which has already caused a
 * 404-on-hashed-asset bug on this site once.
 */
export function checkFile(path: string, content: string): string[] {
  const errori: string[] = [];
  if (content.includes('\r')) errori.push(`${path}: contiene interruzioni di riga Windows.`);
  if (!content.startsWith('---\n')) errori.push(`${path}: manca l’intestazione.`);
  if (!content.endsWith('\n')) errori.push(`${path}: non termina con una riga vuota.`);
  // Three dashes open and close the frontmatter; a title containing a bare `---`
  // on its own line would close it early and push prose into the metadata.
  if (content.split('\n---').length > 2) errori.push(`${path}: l’intestazione non è valida.`);
  return errori;
}
