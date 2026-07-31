/**
 * The block editor.
 *
 * Design constraints that are not negotiable, and why:
 *
 * - **Everything is a `<textarea>`, never a contenteditable.** On an iOS keyboard
 *   contenteditable fights autocorrect, loses the caret on rotation, and pastes
 *   arbitrary HTML. A textarea does none of that, and the client writes on a
 *   phone exclusively.
 * - **Bold and links are buttons that wrap the selection**, producing the two
 *   markdown constructs `src/lib/admin/blocks.ts` permits. That module re-parses
 *   and escapes whatever comes back, so the stored string is validated rather
 *   than trusted — a mistyped `[` can never reach the published page as markup.
 * - **localStorage is the autosave; KV is the backup.** The free plan allows
 *   1,000 KV writes a day across the whole site, so a save-on-timer would spend
 *   it in an afternoon and then fail silently on the one feature whose entire
 *   job is not losing his work. localStorage is free, instant, and works with no
 *   signal.
 */

import type { Block } from '../lib/admin/blocks';
import { BLOCK_LABELS } from '../lib/admin/blocks';

interface DraftDoc {
  title: string;
  description: string;
  date: string;
  coverPhotoId: string;
  blocks: Block[];
  publishedSlug?: string;
  owner?: string;
  updatedAt?: number;
}

interface PhotoMeta {
  id: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

interface TourLink {
  slug: string;
  nome: string;
}

const AUTOSAVE_LOCAL_MS = 400;
/** KV write cadence. Deliberately slow — see the header note on the write budget. */
const AUTOSAVE_REMOTE_MS = 60_000;

export interface EditorOptions {
  root: HTMLElement;
  draftId: string;
  doc: DraftDoc;
  foto: PhotoMeta[];
  tours: TourLink[];
}

export function mountEditor({ root, draftId, doc, foto, tours }: EditorOptions) {
  const localKey = `vp:bozza:${draftId}`;
  let dirtyRemote = false;
  let lastRemoteJson = JSON.stringify(doc);

  const stato = root.querySelector('[data-stato]') as HTMLElement;
  const elenco = root.querySelector('[data-blocchi]') as HTMLElement;

  /* ---------------------------------------------------------------- storage */

  const salvaLocale = debounce(() => {
    try {
      localStorage.setItem(localKey, JSON.stringify({ doc, at: Date.now() }));
    } catch {
      // Quota or private browsing. The KV backup still runs; say nothing, since
      // there is nothing he could do about it.
    }
  }, AUTOSAVE_LOCAL_MS);

  async function salvaRemoto(motivo: 'auto' | 'manuale' | 'uscita'): Promise<boolean> {
    const payload = JSON.stringify(doc);
    if (motivo === 'auto' && payload === lastRemoteJson) return true;

    if (motivo === 'uscita') {
      // The page is going away; a normal fetch is cancelled mid-flight. sendBeacon
      // survives, which is the difference between keeping and losing whatever he
      // wrote in the last minute.
      try {
        return navigator.sendBeacon(
          '/admin/api/bozza',
          new Blob([JSON.stringify({ id: draftId, doc })], { type: 'application/json' }),
        );
      } catch {
        return false;
      }
    }

    segnala(motivo === 'manuale' ? 'Salvo…' : '');
    try {
      const res = await fetch('/admin/api/bozza', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: draftId, doc }),
      });
      if (res.status === 401 || res.status === 403) {
        segnala('Collegamento scaduto — il testo è salvo sul telefono. Entra di nuovo.', 'errore');
        return false;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { errore?: string };
        segnala(data.errore ?? 'Non riesco a salvare adesso. Il testo resta sul telefono.', 'errore');
        return false;
      }
      lastRemoteJson = payload;
      dirtyRemote = false;
      segnala('Salvato', 'ok');
      return true;
    } catch {
      segnala('Sei offline — il testo resta sul telefono e lo salvo appena torni in linea.', 'attesa');
      return false;
    }
  }

  function segnala(testo: string, tipo: 'ok' | 'errore' | 'attesa' | '' = '') {
    stato.textContent = testo;
    stato.className =
      'eyebrow ' +
      (tipo === 'ok'
        ? 'text-verde'
        : tipo === 'errore'
          ? 'text-rosso'
          : tipo === 'attesa'
            ? 'text-ouro'
            : 'text-paper/40');
  }

  function cambiato() {
    dirtyRemote = true;
    doc.updatedAt = Date.now();
    salvaLocale();
    segnala('Non salvato', 'attesa');
  }

  /* ------------------------------------------------------------------ blocks */

  function autoGrow(area: HTMLTextAreaElement) {
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight}px`;
  }

  /** Wraps the current selection, which is how Grassetto and the tour link work. */
  function avvolgi(area: HTMLTextAreaElement, prima: string, dopo: string, onEmpty: string) {
    const { selectionStart: s, selectionEnd: e, value } = area;
    const scelto = value.slice(s, e) || onEmpty;
    area.value = value.slice(0, s) + prima + scelto + dopo + value.slice(e);
    area.focus();
    area.setSelectionRange(s + prima.length, s + prima.length + scelto.length);
    autoGrow(area);
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function bottone(testo: string, titolo: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = testo;
    b.title = titolo;
    b.setAttribute('aria-label', titolo);
    b.className =
      'rounded border border-paper/20 px-2 py-1 text-xs text-paper/70 hover:border-ouro/50 hover:text-paper';
    b.addEventListener('click', onClick);
    return b;
  }

  function barraTesto(area: HTMLTextAreaElement): HTMLElement {
    const barra = document.createElement('div');
    barra.className = 'mt-2 flex flex-wrap gap-2';
    barra.appendChild(
      bottone('Grassetto', 'Metti in grassetto il testo selezionato', () =>
        avvolgi(area, '**', '**', 'testo'),
      ),
    );
    if (tours.length) {
      barra.appendChild(
        bottone('Collega un tour', 'Inserisci un link a uno dei tuoi tour', () => {
          const scelta = window.prompt(
            `Quale tour vuoi collegare?\n${tours.map((t, i) => `${i + 1}. ${t.nome}`).join('\n')}`,
            '1',
          );
          const n = Number(scelta);
          const tour = tours[n - 1];
          if (!tour) return;
          avvolgi(area, '[', `](../../tour/${tour.slug}/)`, tour.nome);
        }),
      );
    }
    return barra;
  }

  function schedaBlocco(block: Block, index: number): HTMLElement {
    const card = document.createElement('li');
    card.className = 'rounded-lg border border-paper/10 bg-paper/5 p-3';

    const testa = document.createElement('div');
    testa.className = 'mb-2 flex items-center justify-between gap-2';
    const etichetta = document.createElement('span');
    etichetta.className = 'eyebrow text-paper/40';
    etichetta.textContent = BLOCK_LABELS[block.k];
    testa.appendChild(etichetta);

    const controlli = document.createElement('div');
    controlli.className = 'flex gap-1';
    controlli.appendChild(
      bottone('↑', 'Sposta su', () => {
        if (index === 0) return;
        [doc.blocks[index - 1], doc.blocks[index]] = [doc.blocks[index]!, doc.blocks[index - 1]!];
        cambiato();
        disegna();
      }),
    );
    controlli.appendChild(
      bottone('↓', 'Sposta giù', () => {
        if (index >= doc.blocks.length - 1) return;
        [doc.blocks[index + 1], doc.blocks[index]] = [doc.blocks[index]!, doc.blocks[index + 1]!];
        cambiato();
        disegna();
      }),
    );
    controlli.appendChild(
      bottone('Togli', 'Elimina questo blocco', () => {
        // Confirmation, because on a phone the delete button is a thumb-width
        // from the move buttons and there is no undo.
        if (!window.confirm('Vuoi togliere questo blocco?')) return;
        doc.blocks.splice(index, 1);
        cambiato();
        disegna();
      }),
    );
    testa.appendChild(controlli);
    card.appendChild(testa);

    if (block.k === 'foto') {
      card.appendChild(corpoFoto(block));
    } else if (block.k === 'ul' || block.k === 'ol') {
      card.appendChild(corpoElenco(block));
    } else {
      card.appendChild(corpoTesto(block));
    }

    return card;
  }

  function areaTesto(valore: string, placeholder: string, onInput: (v: string) => void) {
    const area = document.createElement('textarea');
    area.value = valore;
    area.rows = 3;
    area.placeholder = placeholder;
    area.className =
      'w-full resize-none rounded border border-paper/20 bg-ink px-3 py-2 text-base leading-relaxed text-paper';
    area.addEventListener('input', () => {
      onInput(area.value);
      autoGrow(area);
      cambiato();
    });
    requestAnimationFrame(() => autoGrow(area));
    return area;
  }

  function corpoTesto(block: Block & { testo: string }): HTMLElement {
    const wrap = document.createElement('div');
    const placeholder =
      block.k === 'quote'
        ? 'Una frase tua, come la diresti a voce'
        : block.k === 'h2' || block.k === 'h3'
          ? 'Il titolo di questa parte'
          : 'Scrivi qui…';
    const area = areaTesto(block.testo, placeholder, (v) => {
      block.testo = v;
    });
    wrap.appendChild(area);
    if (block.k === 'p' || block.k === 'quote') wrap.appendChild(barraTesto(area));
    return wrap;
  }

  function corpoElenco(block: Block & { voci: string[] }): HTMLElement {
    const wrap = document.createElement('div');
    const area = areaTesto(block.voci.join('\n'), 'Una voce per riga', (v) => {
      // One line per item is the only list interaction that survives a phone
      // keyboard: no per-row add/remove buttons to hit, and Enter does the
      // obvious thing.
      block.voci = v.split('\n');
    });
    wrap.appendChild(area);
    const nota = document.createElement('p');
    nota.className = 'mt-1 text-xs text-paper/40';
    nota.textContent = 'Una voce per riga.';
    wrap.appendChild(nota);
    return wrap;
  }

  function corpoFoto(block: Block & { fotoId: string; alt: string; didascalia?: string }) {
    const wrap = document.createElement('div');

    const griglia = document.createElement('div');
    griglia.className = 'grid grid-cols-3 gap-2';
    if (!foto.length) {
      const vuoto = document.createElement('p');
      vuoto.className = 'text-sm text-paper/50';
      vuoto.textContent = 'Non hai ancora caricato foto. Vai su «Foto» e caricane qualcuna.';
      griglia.appendChild(vuoto);
    }
    for (const f of foto) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `overflow-hidden rounded border-2 ${
        f.id === block.fotoId ? 'border-ouro' : 'border-transparent'
      }`;
      const img = document.createElement('img');
      img.src = `/admin/api/foto?bozza=${encodeURIComponent(draftId)}&foto=${encodeURIComponent(f.id)}`;
      img.alt = f.alt || '';
      img.loading = 'lazy';
      img.className = 'aspect-square w-full object-cover';
      b.appendChild(img);
      b.addEventListener('click', () => {
        block.fotoId = f.id;
        // Carrying the photo's own alt across saves him writing it twice — the
        // same photo usually means the same description.
        if (!block.alt) block.alt = f.alt;
        if (!block.didascalia && f.caption) block.didascalia = f.caption;
        cambiato();
        disegna();
      });
      griglia.appendChild(b);
    }
    wrap.appendChild(griglia);

    wrap.appendChild(
      campo('Descrivi la foto (obbligatorio)', block.alt, 'Es. I tetti del Vidigal al tramonto', (v) => {
        block.alt = v;
      }),
    );
    wrap.appendChild(
      campo(
        'Didascalia sotto la foto (facoltativa)',
        block.didascalia ?? '',
        'Lascia vuoto se non serve',
        (v) => {
          block.didascalia = v;
        },
      ),
    );
    return wrap;
  }

  function campo(etichetta: string, valore: string, placeholder: string, onInput: (v: string) => void) {
    const label = document.createElement('label');
    label.className = 'mt-3 flex flex-col gap-1';
    const span = document.createElement('span');
    span.className = 'eyebrow text-paper/40';
    span.textContent = etichetta;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = valore;
    input.placeholder = placeholder;
    input.className =
      'w-full rounded border border-paper/20 bg-ink px-3 py-2 text-base text-paper';
    input.addEventListener('input', () => {
      onInput(input.value);
      cambiato();
    });
    label.appendChild(span);
    label.appendChild(input);
    return label;
  }

  function disegna() {
    elenco.textContent = '';
    doc.blocks.forEach((b, i) => elenco.appendChild(schedaBlocco(b, i)));
  }

  /* ----------------------------------------------------------------- wiring */

  (root.querySelectorAll('[data-aggiungi]') as NodeListOf<HTMLElement>).forEach((b) => {
    b.addEventListener('click', () => {
      const k = b.dataset.aggiungi as Block['k'];
      doc.blocks.push(nuovoBlocco(k));
      cambiato();
      disegna();
      // Land the caret in the block he just created, at the bottom of the page.
      const ultimo = elenco.lastElementChild?.querySelector('textarea');
      ultimo?.focus();
      ultimo?.scrollIntoView({ block: 'center' });
    });
  });

  root.querySelector('[data-salva]')?.addEventListener('click', () => void salvaRemoto('manuale'));

  bindCampo(root, '[data-titolo]', doc.title, (v) => {
    doc.title = v;
    cambiato();
  });
  bindCampo(root, '[data-riassunto]', doc.description, (v) => {
    doc.description = v;
    cambiato();
  });
  bindCampo(root, '[data-data]', doc.date, (v) => {
    doc.date = v;
    cambiato();
  });

  const cover = root.querySelector('[data-copertina]') as HTMLSelectElement | null;
  if (cover) {
    cover.value = doc.coverPhotoId;
    cover.addEventListener('change', () => {
      doc.coverPhotoId = cover.value;
      cambiato();
      aggiornaAnteprimaCopertina();
    });
  }

  /**
   * Shows the actual 16:9 crop the cover will get.
   *
   * His photos are mostly vertical and the cover renders `aspect-[16/9]`, so the
   * top and bottom are cut. Showing the crop is what stops a beheaded portrait
   * being discovered after publishing rather than before.
   */
  function aggiornaAnteprimaCopertina() {
    const box = root.querySelector('[data-copertina-anteprima]') as HTMLElement | null;
    if (!box) return;
    box.textContent = '';
    const f = foto.find((x) => x.id === doc.coverPhotoId);
    if (!f) return;
    const img = document.createElement('img');
    img.src = `/admin/api/foto?bozza=${encodeURIComponent(draftId)}&foto=${encodeURIComponent(f.id)}`;
    img.alt = '';
    img.className = 'aspect-[16/9] w-full rounded object-cover';
    box.appendChild(img);
  }
  aggiornaAnteprimaCopertina();

  // Push to KV on a slow timer, and whenever the phone takes the page away —
  // switching apps mid-article is the normal case, not the edge case.
  setInterval(() => {
    if (dirtyRemote) void salvaRemoto('auto');
  }, AUTOSAVE_REMOTE_MS);

  addEventListener('pagehide', () => {
    if (dirtyRemote) void salvaRemoto('uscita');
  });
  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dirtyRemote) void salvaRemoto('uscita');
  });
  // Coming back online is the moment a failed save can finally succeed.
  addEventListener('online', () => {
    if (dirtyRemote) void salvaRemoto('auto');
  });

  disegna();
  segnala('');

  return { doc, salva: () => salvaRemoto('manuale') };
}

function bindCampo(
  root: HTMLElement,
  selector: string,
  valore: string,
  onInput: (v: string) => void,
) {
  const el = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) return;
  el.value = valore;
  el.addEventListener('input', () => onInput(el.value));
}

function nuovoBlocco(k: Block['k']): Block {
  switch (k) {
    case 'ul':
    case 'ol':
      return { k, voci: [''] };
    case 'foto':
      return { k: 'foto', fotoId: '', alt: '' };
    default:
      return { k, testo: '' } as Block;
  }
}

function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

/**
 * Recovers whatever localStorage holds if it is newer than what the server sent.
 *
 * This is the path that makes "Safari killed the tab" survivable: KV has what
 * was pushed a minute ago, localStorage has every keystroke since.
 */
export function recuperaLocale(draftId: string, server: DraftDoc): DraftDoc {
  try {
    const raw = localStorage.getItem(`vp:bozza:${draftId}`);
    if (!raw) return server;
    const saved = JSON.parse(raw) as { doc?: DraftDoc; at?: number };
    if (!saved.doc || !Array.isArray(saved.doc.blocks)) return server;
    return (saved.at ?? 0) > (server.updatedAt ?? 0) ? saved.doc : server;
  } catch {
    return server;
  }
}
