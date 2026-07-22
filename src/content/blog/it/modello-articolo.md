---
title: 'Modello di articolo (bozza — non viene pubblicato)'
description: 'File di riferimento per il formato degli articoli del blog. Resta in bozza: non compare sul sito.'
date: 2026-07-21
locale: it
draft: true
---

Questo file esiste solo come modello del formato: frontmatter come sopra, corpo
in Markdown qui sotto. Per pubblicare un articolo vero:

1. copia questo file in `src/content/blog/it/<slug>.md` (e la versione inglese
   in `src/content/blog/en/<slug>.md`, **stesso slug** — le due versioni sono
   una coppia e devono esistere entrambe);
2. compila `title`, `description`, `date`, `locale`;
3. (facoltativo) aggiungi `cover: <chiave>` — una chiave di `src/assets/photos`
   senza `.jpg` (es. `tour-rocinha`): diventa l’immagine di testata
   dell’articolo, la miniatura nell’indice del blog e l’anteprima social;
4. togli `draft: true`.

Il testo si scrive in Markdown normale — paragrafi, **grassetto**, elenchi.

Immagini dentro l’articolo:
`![descrizione della foto](../../../assets/photos/<chiave>.jpg)` — la
descrizione tra parentesi quadre è obbligatoria, nella lingua dell’articolo.
Link a un tour: `[testo](../../tour/<slug-del-tour>/)` — percorso relativo,
funziona identico in italiano e in inglese.
