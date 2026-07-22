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
   in `src/content/blog/en/<slug>.md`, **stesso slug**);
2. compila `title`, `description`, `date`, `locale`;
3. togli `draft: true`.

Il testo si scrive in Markdown normale — paragrafi, **grassetto**, elenchi.
