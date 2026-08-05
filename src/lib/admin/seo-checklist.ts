/**
 * The "Pronto per Google" checklist — live coaching in the editor.
 *
 * A non-technical author writes good prose but not, unprompted, SEO-ready prose:
 * a title of the right length, a real meta description, a subtitle, a link to the
 * tour, described photos. This turns the silent rules the publish gate enforces
 * (publish-check.ts) into visible, friendly guidance *as he types* — so the
 * article that reaches Pubblica is already discoverable.
 *
 * Pure and DOM-free on purpose: the same function runs in the browser (the live
 * panel) and could run server-side. It shares the length thresholds with
 * publish-check.ts so the coaching can never contradict the gate. Nothing here
 * blocks anything — every item is advice; the hard gate stays in publish-check.
 */

import type { Block } from './blocks';
import { DESCRIPTION_MIN, DESCRIPTION_MAX, TITLE_MIN } from './publish-check';

/** The length a Google result comfortably shows — the coaching target, tighter
 *  than the gate's 50–200 acceptable range. */
const DESC_IDEAL_MIN = 120;
const DESC_IDEAL_MAX = 160;
/** Beyond this a title is truncated in the search result. */
const TITLE_IDEAL_MAX = 65;

export interface ChecklistDoc {
  title: string;
  description: string;
  coverPhotoId: string;
  relatedTour?: string;
  blocks: Block[];
}

export interface ChecklistItem {
  /** 'ok' → done (green) · 'todo' → not yet (amber, never blocking). */
  stato: 'ok' | 'todo';
  etichetta: string;
  /** Shown under the label when 'todo': what to do about it, in his words. */
  suggerimento?: string;
}

/** The prose of a block, for scanning the body for an in-article tour link. */
const testoDelBlocco = (b: Block): string => {
  if (b.k === 'ul' || b.k === 'ol') return b.voci.join(' ');
  if (b.k === 'foto') return '';
  return b.testo;
};

export function seoChecklist(doc: ChecklistDoc): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Titolo — present, and short enough to show whole in a result.
  const titolo = doc.title.trim();
  if (titolo.length < TITLE_MIN) {
    items.push({
      stato: 'todo',
      etichetta: 'Titolo chiaro',
      suggerimento: 'Scrivi un titolo che dica di cosa parla l’articolo.',
    });
  } else if (titolo.length > TITLE_IDEAL_MAX) {
    items.push({
      stato: 'todo',
      etichetta: `Titolo un po’ lungo (${titolo.length} caratteri)`,
      suggerimento: `Google ne mostra circa ${TITLE_IDEAL_MAX}: prova ad accorciarlo.`,
    });
  } else {
    items.push({ stato: 'ok', etichetta: 'Titolo chiaro' });
  }

  // Riassunto — the meta description. Live length against the ideal band.
  const desc = doc.description.trim().length;
  if (desc === 0) {
    items.push({
      stato: 'todo',
      etichetta: 'Riassunto per Google',
      suggerimento: 'È la frase che si legge sotto il titolo su Google. Scrivine una.',
    });
  } else if (desc < DESCRIPTION_MIN) {
    items.push({
      stato: 'todo',
      etichetta: `Riassunto troppo corto (${desc} caratteri)`,
      suggerimento: `Punta a ${DESC_IDEAL_MIN}–${DESC_IDEAL_MAX}: adesso su Google si vedrebbe quasi vuoto.`,
    });
  } else if (desc > DESCRIPTION_MAX) {
    items.push({
      stato: 'todo',
      etichetta: `Riassunto troppo lungo (${desc} caratteri)`,
      suggerimento: `Google ne mostra circa ${DESC_IDEAL_MAX}: taglia un po’.`,
    });
  } else if (desc < DESC_IDEAL_MIN || desc > DESC_IDEAL_MAX) {
    items.push({
      stato: 'ok',
      etichetta: `Riassunto ok (${desc} caratteri — meglio ${DESC_IDEAL_MIN}–${DESC_IDEAL_MAX})`,
    });
  } else {
    items.push({ stato: 'ok', etichetta: `Riassunto giusto (${desc} caratteri)` });
  }

  // Almeno un sottotitolo (H2).
  const haSottotitolo = doc.blocks.some((b) => b.k === 'h2' && b.testo.trim().length > 0);
  items.push(
    haSottotitolo
      ? { stato: 'ok', etichetta: 'Ha un sottotitolo' }
      : {
          stato: 'todo',
          etichetta: 'Almeno un sottotitolo',
          suggerimento: 'Aggiungi un «Sottotitolo»: spezza l’articolo e aiuta lettori e Google.',
        },
  );

  // Collegamento a un tour — the "Di quale tour parla?" choice, or a link in the body.
  const linkNelCorpo = doc.blocks.some((b) => testoDelBlocco(b).includes('](../../tour/'));
  items.push(
    doc.relatedTour || linkNelCorpo
      ? { stato: 'ok', etichetta: 'Collegato a un tour' }
      : {
          stato: 'todo',
          etichetta: 'Collegato a un tour',
          suggerimento: 'Scegli «Di quale tour parla?» qui sopra, o metti un link a un tuo tour.',
        },
  );

  // Foto di copertina.
  items.push(
    doc.coverPhotoId
      ? { stato: 'ok', etichetta: 'Foto di copertina' }
      : {
          stato: 'todo',
          etichetta: 'Foto di copertina',
          suggerimento: 'Senza copertina, sul blog l’articolo appare senza immagine.',
        },
  );

  // Descrizioni delle foto — only when there are photos to describe.
  const fotoConId = doc.blocks.filter((b) => b.k === 'foto' && b.fotoId.length > 0);
  if (fotoConId.length > 0) {
    const senzaAlt = fotoConId.filter((b) => b.k === 'foto' && b.alt.trim().length === 0).length;
    items.push(
      senzaAlt === 0
        ? { stato: 'ok', etichetta: 'Tutte le foto hanno una descrizione' }
        : {
            stato: 'todo',
            etichetta: 'Descrivi tutte le foto',
            suggerimento: `${senzaAlt} senza descrizione: scrivi cosa si vede (lo legge anche Google).`,
          },
    );
  }

  return items;
}
