/**
 * Optional AI help for the author — currently: a suggested "Riassunto" (the meta
 * description Google shows under the title).
 *
 * A non-technical writer often leaves the description empty or writes it as an
 * afterthought, yet it is one of the highest-leverage SEO fields. The Workers AI
 * binding is already here for the translation step and free at this volume, so a
 * one-tap suggestion costs nothing new. It is a SUGGESTION he accepts or edits,
 * never a silent rewrite — unverified copy must not reach the live page on its
 * own. Best-effort like the translator: any failure returns null and the button
 * says so, rather than throwing.
 */

import type { WorkersAI } from './translate';

const MODEL = '@cf/meta/llama-3.1-8b-instruct';
/** Hard ceiling on what we hand back — a description Google would truncate anyway. */
const MAX = 170;

const SYSTEM = [
  'Sei l’assistente di un blog di una guida turistica italiana a Rio de Janeiro.',
  'Scrivi UNA frase in italiano che riassuma l’articolo: è la descrizione che',
  'compare su Google sotto il titolo.',
  'Deve stare fra 120 e 160 caratteri, essere concreta e invitante, senza',
  'esagerazioni né clickbait.',
  'Nomina il luogo o il tour di cui parla l’articolo.',
  'Niente virgolette, niente emoji, niente «Scopri» o «Immergiti».',
  'Rispondi SOLO con la frase, senza premesse.',
].join(' ');

/**
 * Proposes an Italian meta description from the article's title and prose.
 * Returns null when the binding is absent, the article is empty, or the model
 * gives nothing usable.
 */
export async function suggestDescription(
  ai: WorkersAI | null,
  titolo: string,
  testo: string,
): Promise<string | null> {
  const corpo = testo.trim();
  if (!ai || (!corpo && !titolo.trim())) return null;

  // Cap the body: the first stretch of an article carries its subject, and a
  // shorter prompt keeps the single call well within the free CPU/neuron budget.
  const prompt = `Titolo: ${titolo.trim()}\n\nArticolo:\n${corpo.slice(0, 4000)}`;

  try {
    const out = (await ai.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    })) as { response?: string };

    let s = (out?.response ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      // The 8B model likes to wrap the answer in quotes or guillemets despite the
      // instruction; strip a single enclosing pair.
      .replace(/^["'«»\s]+|["'«»\s]+$/g, '');
    if (!s) return null;
    if (s.length > MAX) s = s.slice(0, MAX).replace(/\s+\S*$/, '').trim();
    return s || null;
  } catch {
    return null;
  }
}
