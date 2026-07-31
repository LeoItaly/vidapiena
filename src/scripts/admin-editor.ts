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
 * - **Photos are uploaded from inside the editor**, through the same client
 *   pipeline /admin/foto uses. Before that they could only be picked from a
 *   library filled on a separate page — and that page uploads against a draft id
 *   of its own, so nothing uploaded there ever appeared in this picker. The empty
 *   grid told him to go to «Foto», he went, uploaded, came back, and the grid was
 *   still empty. A photo now enters the article where he is standing.
 */

import type { Block } from '../lib/admin/blocks';
import { BLOCK_LABELS } from '../lib/admin/blocks';
import { blocksToPreviewHtml } from '../lib/admin/preview-html';
import { processAndUpload } from '../lib/admin/upload-client';

const MODO_ATTIVO = 'rounded-md px-3 py-1.5 text-sm font-medium bg-ouro text-ink';
const MODO_INATTIVO = 'rounded-md px-3 py-1.5 text-sm font-medium text-paper/60';

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

  /**
   * Exit-guard state.
   *
   * `permettiUscita` lets an intentional navigation past the beforeunload net (a
   * desktop-only prompt; iOS Safari never shows it). `scartaAllUscita` is set only
   * on the explicit "Esci senza salvare" path, and suppresses the exit beacon so
   * that choice actually means what it says — the server copy is left where it was.
   * localStorage still holds the text, which is the phone-crash net, not a publish.
   */
  let permettiUscita = false;
  let scartaAllUscita = false;

  const stato = root.querySelector('[data-stato]') as HTMLElement;
  const elenco = root.querySelector('[data-blocchi]') as HTMLElement;

  /**
   * Photos uploaded in this sitting, kept as object URLs.
   *
   * The bytes are already in memory the moment the upload succeeds, so asking the
   * Worker to send them straight back would cost him ~400 KB of Rio mobile data
   * per photo and a visible wait before the thumbnail appears. Not revoked: the
   * same URL is re-read on every redraw and by the live preview, and a handful of
   * ≤900 KB blobs is nothing against the page being open for an afternoon.
   */
  const anteprimeLocali = new Map<string, string>();

  /**
   * The URL for a photo, whichever kind it is. A staged upload is served from KV
   * by its draft id; a `pub:<key>` photo — one already committed, from an article
   * opened for editing — is served from the repo; one just uploaded is served from
   * memory. Keeping this in one place means every img (block, cover preview, live
   * preview) treats all three the same.
   */
  const fotoUrl = (id: string): string =>
    anteprimeLocali.get(id) ??
    (id.startsWith('pub:')
      ? `/admin/api/foto-pubblicata?key=${encodeURIComponent(id.slice(4))}`
      : `/admin/api/foto?bozza=${encodeURIComponent(draftId)}&foto=${encodeURIComponent(id)}`);

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

  /* -------------------------------------------------------------- exit guard */

  /**
   * Asks whether to save before leaving.
   *
   * A small modal rather than `window.confirm`, because a two-button confirm
   * cannot offer the three real answers — save, leave, stay — and on a phone a
   * native dialog is dismissed by an accidental tap. Resolves to the choice; the
   * caller acts on it. Styled with the shared .btn tokens, so it is the same brand
   * as the rest of the panel.
   */
  function chiediSalvataggio(): Promise<'salva' | 'esci' | 'annulla'> {
    return new Promise((resolve) => {
      const sfondo = document.createElement('div');
      sfondo.className =
        'fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 backdrop-blur sm:items-center';
      sfondo.setAttribute('role', 'dialog');
      sfondo.setAttribute('aria-modal', 'true');
      sfondo.setAttribute('aria-labelledby', 'vp-uscita-titolo');

      const riquadro = document.createElement('div');
      riquadro.className = 'w-full max-w-sm rounded-xl border border-paper/15 bg-ink p-5';

      const titolo = document.createElement('h2');
      titolo.id = 'vp-uscita-titolo';
      titolo.className = 'font-display text-xl font-bold text-paper';
      titolo.textContent = 'Hai modifiche non salvate';

      const testo = document.createElement('p');
      testo.className = 'mt-2 text-sm text-paper/60';
      testo.textContent = 'Vuoi salvarle prima di uscire?';

      const azioni = document.createElement('div');
      azioni.className = 'mt-5 flex flex-col gap-2';

      let chiuso = false;
      const chiudi = (scelta: 'salva' | 'esci' | 'annulla') => {
        if (chiuso) return;
        chiuso = true;
        document.removeEventListener('keydown', suTasto);
        sfondo.remove();
        resolve(scelta);
      };
      const suTasto = (e: KeyboardEvent) => {
        if (e.key === 'Escape') chiudi('annulla');
      };

      const bSalva = document.createElement('button');
      bSalva.type = 'button';
      bSalva.className = 'btn btn-primary w-full';
      bSalva.textContent = 'Salva ed esci';
      bSalva.addEventListener('click', () => chiudi('salva'));

      const bEsci = document.createElement('button');
      bEsci.type = 'button';
      bEsci.className = 'btn w-full';
      bEsci.textContent = 'Esci senza salvare';
      bEsci.addEventListener('click', () => chiudi('esci'));

      const bAnnulla = document.createElement('button');
      bAnnulla.type = 'button';
      bAnnulla.className = 'eyebrow w-full py-2 text-paper/50';
      bAnnulla.textContent = 'Annulla';
      bAnnulla.addEventListener('click', () => chiudi('annulla'));

      azioni.appendChild(bSalva);
      azioni.appendChild(bEsci);
      azioni.appendChild(bAnnulla);
      riquadro.appendChild(titolo);
      riquadro.appendChild(testo);
      riquadro.appendChild(azioni);
      sfondo.appendChild(riquadro);
      sfondo.addEventListener('click', (e) => {
        if (e.target === sfondo) chiudi('annulla');
      });
      document.addEventListener('keydown', suTasto);
      document.body.appendChild(sfondo);
      bSalva.focus();
    });
  }

  /**
   * Leaving the editor safely.
   *
   * `chiedi` is true for the ways *out* of the article — the back link, and the
   * shell's home and logout links: with unsaved changes it asks first. It is false
   * for the steps *forward* in the same flow (Anteprima, Pubblica), which read the
   * draft from KV and so must push the latest text up before they load — no
   * question, just save-then-go. Either way, a failed save keeps him on the page
   * with the reason already shown, instead of navigating to a stale copy.
   */
  async function esciVerso(url: string, chiedi: boolean) {
    if (dirtyRemote) {
      if (chiedi) {
        const scelta = await chiediSalvataggio();
        if (scelta === 'annulla') return;
        if (scelta === 'esci') {
          scartaAllUscita = true;
          permettiUscita = true;
          location.href = url;
          return;
        }
      }
      const ok = await salvaRemoto('manuale');
      if (!ok) return;
    }
    permettiUscita = true;
    location.href = url;
  }

  /* ------------------------------------------------------------------ blocks */

  function autoGrow(area: HTMLTextAreaElement) {
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight}px`;
  }

  /**
   * Wraps the current selection, which is how every format button works.
   *
   * `trim` pulls any whitespace out of the wrapped run — italics need their `_`
   * markers hard against the word or CommonMark (and so the published page) will
   * not emphasise them.
   */
  function avvolgi(
    area: HTMLTextAreaElement,
    prima: string,
    dopo: string,
    onEmpty: string,
    trim = false,
  ) {
    let s = area.selectionStart;
    let e = area.selectionEnd;
    const value = area.value;
    if (trim) {
      while (s < e && /\s/.test(value[s]!)) s += 1;
      while (e > s && /\s/.test(value[e - 1]!)) e -= 1;
    }
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

  /**
   * A format button that keeps the caret where it is.
   *
   * Tapping a normal button blurs the textarea first, which throws away the
   * selection the button is meant to wrap. Cancelling the pointerdown default
   * stops the focus leaving the field, so the selection is still there when the
   * click handler runs.
   */
  function bottoneFormato(testo: string, titolo: string, onClick: () => void): HTMLButtonElement {
    const b = bottone(testo, titolo, onClick);
    b.addEventListener('pointerdown', (e) => e.preventDefault());
    return b;
  }

  /**
   * The inline-formatting toolbar under a text block — the Gutenberg-style bit.
   * Everything it inserts is one of the constructs blocks.ts validates on the way
   * out, so a wrong tap can never put raw markup on the public page.
   */
  function barraTesto(area: HTMLTextAreaElement): HTMLElement {
    const barra = document.createElement('div');
    barra.className = 'mt-2 flex flex-wrap gap-2';
    barra.appendChild(
      bottoneFormato('Grassetto', 'Metti in grassetto il testo selezionato', () =>
        avvolgi(area, '**', '**', 'testo'),
      ),
    );
    barra.appendChild(
      bottoneFormato('Corsivo', 'Metti in corsivo il testo selezionato', () =>
        avvolgi(area, '_', '_', 'testo', true),
      ),
    );
    barra.appendChild(
      bottoneFormato('Collega', 'Trasforma il testo selezionato in un link', () => {
        const url = window.prompt('Indirizzo del link (deve iniziare con https://)', 'https://');
        if (!url) return;
        if (!/^https:\/\/\S+$/i.test(url)) {
          window.alert('L’indirizzo deve iniziare con https:// e non deve avere spazi.');
          return;
        }
        avvolgi(area, '[', `](${url})`, 'testo del link');
      }),
    );
    if (tours.length) {
      barra.appendChild(
        bottoneFormato('Tour', 'Inserisci un link a uno dei tuoi tour', () => {
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
      card.appendChild(corpoFoto(block, index));
    } else if (block.k === 'ul' || block.k === 'ol') {
      card.appendChild(corpoElenco(block));
    } else {
      card.appendChild(corpoTesto(block));
    }

    return card;
  }

  function areaTesto(
    valore: string,
    placeholder: string,
    onInput: (v: string) => void,
    extra = '',
  ) {
    const area = document.createElement('textarea');
    area.value = valore;
    area.rows = 3;
    area.placeholder = placeholder;
    area.className =
      'w-full resize-none rounded border border-paper/20 bg-ink px-3 py-2 leading-relaxed text-paper ' +
      (extra || 'text-base');
    area.addEventListener('input', () => {
      onInput(area.value);
      autoGrow(area);
      cambiato();
    });
    requestAnimationFrame(() => autoGrow(area));
    return area;
  }

  /** Editing surface styled to echo the finished article — a heading reads big and
   *  bold, a quote sits indented in italic, so the block list already looks like
   *  what it will become. The paper-perfect render is the live preview. */
  function stileBlocco(k: Block['k']): string {
    switch (k) {
      case 'h2':
        return 'font-display text-2xl font-bold';
      case 'h3':
        return 'font-display text-xl font-bold';
      case 'quote':
        return 'border-l-2 border-ouro/50 pl-3 text-base italic';
      default:
        return 'text-base';
    }
  }

  function corpoTesto(block: Block & { testo: string }): HTMLElement {
    const wrap = document.createElement('div');
    const placeholder =
      block.k === 'quote'
        ? 'Una frase tua, come la diresti a voce'
        : block.k === 'h2' || block.k === 'h3'
          ? 'Il titolo di questa parte'
          : 'Scrivi qui…';
    const area = areaTesto(
      block.testo,
      placeholder,
      (v) => {
        block.testo = v;
      },
      stileBlocco(block.k),
    );
    wrap.appendChild(area);
    // Grassetto/Corsivo/Collega on every text block, headings included — a link in
    // a heading is valid, and there is no reason he cannot emphasise a word in one.
    wrap.appendChild(barraTesto(area));
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
    wrap.appendChild(barraTesto(area));
    const nota = document.createElement('p');
    nota.className = 'mt-1 text-xs text-paper/40';
    nota.textContent = 'Una voce per riga.';
    wrap.appendChild(nota);
    return wrap;
  }

  /* -------------------------------------------------------------------- foto */

  /**
   * One photo at a time, across the whole editor.
   *
   * Two 24 MP decodes running at once is how a phone runs out of memory
   * mid-upload, and on iOS the failure is silent — `drawImage` leaves the canvas
   * blank rather than throwing (see photo-process.ts). /admin/foto serialises its
   * batch for the same reason; here the second tap is refused with a sentence
   * instead, because the two taps are on different blocks and queueing them would
   * leave him watching a control that looks idle.
   */
  let caricamento = false;

  /**
   * The tappable "take it off the phone" control, shared by the photo blocks and
   * the cover.
   *
   * A plain `<input type="file">` inside a `<label>`: on iOS that is the one
   * control that reliably opens the camera roll (and offers "Scatta una foto"),
   * and it needs no JS to become tappable. `accept="image/*"` without an explicit
   * heic/heif is deliberate — iOS transcodes HEIC to JPEG on pick *unless* the
   * page claims to accept HEIC, so staying vague is what gets us a JPEG on most
   * iPhones. Same reasoning, same words, as /admin/foto.
   */
  function controlloCarica(etichetta: string, onCaricata: (meta: PhotoMeta) => void): HTMLElement {
    const box = document.createElement('div');

    const label = document.createElement('label');
    label.className =
      'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed ' +
      'border-ouro/50 bg-ouro/10 px-4 py-3 text-center text-base font-medium text-paper';

    const testo = document.createElement('span');
    testo.textContent = etichetta;
    label.appendChild(testo);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'sr-only';
    label.appendChild(input);
    box.appendChild(label);

    const stato = document.createElement('p');
    stato.className = 'mt-2 hidden text-sm';
    stato.setAttribute('role', 'status');
    stato.setAttribute('aria-live', 'polite');
    box.appendChild(stato);

    const dire = (messaggio: string, tipo: 'attesa' | 'errore') => {
      stato.textContent = messaggio;
      stato.className = `mt-2 text-sm ${tipo === 'errore' ? 'text-rosso' : 'text-ouro'}`;
    };

    /**
     * Wipes the previous attempt's message and login link.
     *
     * A photo block is thrown away and rebuilt on every redraw, so a stale message
     * there is impossible. The cover control is created once and lives for the
     * whole page — without this, "Il collegamento è scaduto" and its «Entra di
     * nuovo» button would still be sitting under a cover that has since uploaded
     * perfectly.
     */
    const pulisci = () => {
      stato.textContent = '';
      stato.className = 'mt-2 hidden text-sm';
      box.querySelector('a')?.remove();
    };

    async function esegui(file: File) {
      pulisci();
      caricamento = true;
      input.disabled = true;
      label.classList.add('pointer-events-none', 'opacity-60');
      testo.textContent = 'Un momento…';
      try {
        const esito = await processAndUpload(file, { bozza: draftId }, (fase) => {
          dire(fase === 'preparo' ? 'Preparo la foto…' : 'La sto caricando…', 'attesa');
        });

        if (esito.esito === 'ok') {
          const meta: PhotoMeta = {
            id: esito.id,
            width: esito.foto.width,
            height: esito.foto.height,
            alt: '',
            caption: '',
          };
          anteprimeLocali.set(meta.id, URL.createObjectURL(esito.foto.blob));
          // Into the shared library, so every other photo block's picker has it
          // too — and into the cover list, which is server-rendered and would
          // otherwise never learn about a photo added after the page loaded.
          foto.push(meta);
          opzioneCopertina(meta);
          // Drop the progress line before handing over. A photo block is rebuilt
          // by the redraw and would lose it anyway, but the cover control is not:
          // without this it sat there reading "La sto caricando…" under a cover
          // that had already arrived, which reads as stuck.
          pulisci();
          onCaricata(meta);
          return;
        }

        // A dropped connection is not a bad photo: 'rete' is amber and says he can
        // retry, everything else is red. upload-client owns the wording.
        dire(esito.messaggio, esito.esito === 'rete' ? 'attesa' : 'errore');
        if (esito.esito === 'sessione' && !box.querySelector('a')) {
          // A message about logging in again is useless without something to tap.
          const entra = document.createElement('a');
          entra.href = '/admin/entra';
          entra.className = 'btn btn-primary mt-2 inline-block';
          entra.textContent = 'Entra di nuovo';
          box.appendChild(entra);
        }
      } finally {
        // These nodes are detached by the redraw on the success path; touching
        // them is harmless, and the flag has to be cleared on every path.
        caricamento = false;
        input.disabled = false;
        label.classList.remove('pointer-events-none', 'opacity-60');
        testo.textContent = etichetta;
      }
    }

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      // Cleared immediately so that re-picking the *same* photo — after a failed
      // upload, which is the common case — fires `change` again.
      input.value = '';
      if (!file) return;
      if (caricamento) {
        dire('Sto ancora caricando l’altra foto. Aspetta un attimo e riprova.', 'attesa');
        return;
      }
      void esegui(file);
    });

    return box;
  }

  /**
   * Copies a block's description onto the stored photo itself.
   *
   * Without it the description lived only on the block, and the cover list — which
   * the server renders from the stored photos — went back to reading "Foto 1,
   * Foto 2, Foto 3" on the next page load. A `<select>` shows no thumbnails, so
   * choosing a cover from three identical labels is guesswork he has to resolve by
   * trying each one.
   *
   * One PATCH on blur, never on keystroke, and the route already answers "nothing
   * changed" without writing — so blurring an untouched field, which is the common
   * case, costs a read and not one of the 1,000 daily KV writes. `keepalive`
   * because he types the last description and taps «Pubblica» in the same gesture,
   * and a plain fetch dies with the navigation.
   */
  function salvaDescrizioneFoto(block: Block & { fotoId: string; alt: string; didascalia?: string }) {
    // A `pub:` photo is already committed to the repo; there is no KV record.
    if (!block.fotoId || block.fotoId.startsWith('pub:')) return;
    const body = new FormData();
    body.append('bozza', draftId);
    body.append('foto', block.fotoId);
    body.append('alt', block.alt);
    body.append('didascalia', block.didascalia ?? '');
    void fetch('/admin/api/foto', { method: 'PATCH', body, keepalive: true }).catch(
      () => undefined,
    );
  }

  function corpoFoto(
    block: Block & { fotoId: string; alt: string; didascalia?: string },
    index: number,
  ) {
    const wrap = document.createElement('div');

    // The photo currently on this block. When an article is opened for editing its
    // photos are `pub:<key>` blocks that are not in the staged-upload grid below,
    // so without this he could not see what is already there.
    if (block.fotoId) {
      const attuale = document.createElement('img');
      attuale.src = fotoUrl(block.fotoId);
      attuale.alt = block.alt || '';
      attuale.loading = 'lazy';
      attuale.className = 'mb-2 aspect-video w-full rounded object-cover';
      wrap.appendChild(attuale);
    }

    // Upload first, library second: the photo he wants is nearly always the one he
    // has just taken, and this is the empty state as well — there is no longer a
    // dead end telling him to go and upload somewhere else.
    wrap.appendChild(
      controlloCarica(
        block.fotoId ? 'Cambia foto — prendila dal telefono' : 'Carica una foto dal telefono',
        (meta) => {
          block.fotoId = meta.id;
          cambiato();
          disegna();
          // Redraw replaced the card; put the new one back under his thumb.
          (elenco.children[index] as HTMLElement | undefined)?.scrollIntoView({ block: 'center' });
        },
      ),
    );

    if (foto.length) {
      const oppure = document.createElement('p');
      oppure.className = 'eyebrow mt-4 text-paper/40';
      oppure.textContent = 'oppure scegli una foto che hai già caricato';
      wrap.appendChild(oppure);

      const griglia = document.createElement('div');
      griglia.className = 'mt-2 grid grid-cols-3 gap-2';
      for (const f of foto) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `overflow-hidden rounded border-2 ${
          f.id === block.fotoId ? 'border-ouro' : 'border-transparent'
        }`;
        const img = document.createElement('img');
        img.src = fotoUrl(f.id);
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
    }

    // Publishing is blocked on a missing description, and the block that stops it
    // is often scrolled off the pubblica page by then. Say it here, next to the
    // field, the moment there is a photo to describe.
    const promemoria = document.createElement('p');
    promemoria.className = 'mt-1 text-xs text-ouro';
    const ricorda = () => {
      promemoria.textContent =
        block.fotoId && !block.alt.trim()
          ? 'Scrivi cosa si vede: senza questa frase non posso pubblicare.'
          : '';
    };

    wrap.appendChild(
      campo(
        'Descrivi la foto (obbligatorio)',
        block.alt,
        'Es. I tetti del Vidigal al tramonto',
        (v) => {
          block.alt = v;
          // Keep the library entry in step, so the cover list stops reading
          // "Foto 1, Foto 2, Foto 3" the moment he has described them.
          const meta = foto.find((f) => f.id === block.fotoId);
          if (meta) {
            meta.alt = v;
            rinominaOpzioneCopertina(meta);
          }
          ricorda();
        },
        () => salvaDescrizioneFoto(block),
      ),
    );
    wrap.appendChild(promemoria);
    ricorda();

    wrap.appendChild(
      campo(
        'Didascalia sotto la foto (facoltativa)',
        block.didascalia ?? '',
        'Lascia vuoto se non serve',
        (v) => {
          block.didascalia = v;
        },
        () => salvaDescrizioneFoto(block),
      ),
    );
    return wrap;
  }

  function campo(
    etichetta: string,
    valore: string,
    placeholder: string,
    onInput: (v: string) => void,
    onBlur?: () => void,
  ) {
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
    if (onBlur) input.addEventListener('blur', onBlur);
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

  /**
   * Every way out of the editor runs through the guard.
   *
   * `data-nav="indietro"` are the exits (the back link, "Come si fa?"); they ask
   * before dropping unsaved work. `data-nav="avanti"` are the forward steps
   * (Anteprima, Pubblica); they save first so the next page reads the current text.
   * The shell's home and logout links live outside the editor root, so they are
   * wired from the document. Intercepting these is what makes iOS safe — there is
   * no reliable beforeunload prompt on the one device this client uses.
   */
  const collega = (a: HTMLElement, chiedi: boolean) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      void esciVerso((a as HTMLAnchorElement).href, chiedi);
    });

  (root.querySelectorAll('[data-nav="indietro"]') as NodeListOf<HTMLElement>).forEach((a) =>
    collega(a, true),
  );
  (root.querySelectorAll('[data-nav="avanti"]') as NodeListOf<HTMLElement>).forEach((a) =>
    collega(a, false),
  );
  (
    document.querySelectorAll(
      'header a[href="/admin"], header a[href="/admin/esci"]',
    ) as NodeListOf<HTMLElement>
  ).forEach((a) => collega(a, true));

  // Desktop safety net for the exits JS cannot intercept (reload, tab close,
  // hardware back). No-op on iOS Safari, where pagehide already saves instead.
  addEventListener('beforeunload', (e) => {
    if (permettiUscita || !dirtyRemote) return;
    e.preventDefault();
  });

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
   * The cover list is rendered on the server from the photos that existed when the
   * page loaded, so a photo uploaded since is invisible to it. These two keep it
   * in step without a reload — the alternative being that he uploads a photo,
   * cannot set it as the cover, and has no way to know why.
   */
  const opzioni = new Map<string, HTMLOptionElement>();
  // Seeded from what the server rendered, not only from what this sitting
  // uploaded: otherwise describing a photo he loaded yesterday renamed nothing,
  // and the list stayed "Foto 1, Foto 2" until the page was loaded again.
  for (const opt of cover?.options ?? []) if (opt.value) opzioni.set(opt.value, opt);

  function opzioneCopertina(meta: PhotoMeta) {
    if (!cover || opzioni.has(meta.id)) return;
    const opt = document.createElement('option');
    opt.value = meta.id;
    opt.textContent = meta.alt || `Foto ${foto.length}`;
    cover.appendChild(opt);
    opzioni.set(meta.id, opt);
  }

  function rinominaOpzioneCopertina(meta: PhotoMeta) {
    const opt = opzioni.get(meta.id);
    if (opt && meta.alt.trim()) opt.textContent = meta.alt;
  }

  // Uploading a cover straight from the phone. Without this the only way to get a
  // cover onto a new article is to create a photo block, upload there, then delete
  // the block — which nobody would work out, so articles would go out coverless
  // and appear on the blog index as a grey rectangle.
  const caricaCopertina = root.querySelector('[data-copertina-carica]') as HTMLElement | null;
  caricaCopertina?.appendChild(
    controlloCarica('Carica la copertina dal telefono', (meta) => {
      doc.coverPhotoId = meta.id;
      if (cover) cover.value = meta.id;
      cambiato();
      aggiornaAnteprimaCopertina();
      // The new photo belongs to the shared library, so every block picker must
      // redraw with it.
      disegna();
    }),
  );

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
    // Works for both a staged upload and a `pub:<key>` cover carried over from a
    // published article, so a re-opened article's cover shows its real crop.
    if (!doc.coverPhotoId) return;
    const img = document.createElement('img');
    img.src = fotoUrl(doc.coverPhotoId);
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
    if (dirtyRemote && !scartaAllUscita) void salvaRemoto('uscita');
  });
  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dirtyRemote && !scartaAllUscita)
      void salvaRemoto('uscita');
  });
  // Coming back online is the moment a failed save can finally succeed.
  addEventListener('online', () => {
    if (dirtyRemote) void salvaRemoto('auto');
  });

  /* ------------------------------------------------------------ live preview */

  const dataFmt = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  /**
   * Renders the article exactly as it will look online, into the "Vedi" panel.
   *
   * Reuses `blocksToPreviewHtml` — the same pure function the server-rendered
   * preview page and (via the shared parity rules) the published page use — so
   * this really is the finished article, not an approximation. innerHTML is safe:
   * the function escapes every text node it emits.
   */
  function renderAnteprima() {
    const titolo = root.querySelector('[data-viva-titolo]');
    if (titolo) titolo.textContent = doc.title || 'Senza titolo';

    const data = root.querySelector('[data-viva-data]');
    if (data) {
      const quando = new Date(doc.date);
      data.textContent = Number.isNaN(quando.getTime()) ? '' : dataFmt.format(quando);
    }

    const cover = root.querySelector('[data-viva-copertina]') as HTMLElement | null;
    if (cover) {
      cover.textContent = '';
      if (doc.coverPhotoId) {
        const img = document.createElement('img');
        img.src = fotoUrl(doc.coverPhotoId);
        img.alt = doc.title || '';
        img.className = 'mt-6 aspect-[16/9] w-full rounded-lg object-cover';
        cover.appendChild(img);
      }
    }

    const corpo = root.querySelector('[data-viva-corpo]') as HTMLElement | null;
    if (corpo) corpo.innerHTML = blocksToPreviewHtml(doc.blocks, (id) => fotoUrl(id));
  }

  function modo(quale: 'scrivi' | 'vedi') {
    const scrivi = root.querySelector('[data-pannello="scrivi"]') as HTMLElement | null;
    const vedi = root.querySelector('[data-pannello="vedi"]') as HTMLElement | null;
    if (!scrivi || !vedi) return;
    // Re-render on the way in, so "Vedi" always shows the latest text — there is
    // no live typing to react to while the editor itself is hidden.
    if (quale === 'vedi') renderAnteprima();
    scrivi.hidden = quale !== 'scrivi';
    vedi.hidden = quale !== 'vedi';
    (root.querySelectorAll('[data-modo]') as NodeListOf<HTMLElement>).forEach((b) => {
      const attivo = b.dataset.modo === quale;
      b.setAttribute('aria-selected', attivo ? 'true' : 'false');
      b.className = attivo ? MODO_ATTIVO : MODO_INATTIVO;
    });
  }

  (root.querySelectorAll('[data-modo]') as NodeListOf<HTMLElement>).forEach((b) => {
    b.addEventListener('click', () => modo(b.dataset.modo === 'vedi' ? 'vedi' : 'scrivi'));
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
