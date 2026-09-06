/**
 * Copy — Italiano (locale di default).
 * Voce: Francesco — diretta, calda, prima persona. Ogni fatto è verificato su
 * `Context Knowledge/note tours.md`. Le etichette delle zone restano in portoghese
 * (voce del brand), qui vivono glosse e testi.
 */
export const it = {
  meta: {
    title: 'Favela tour a Rio de Janeiro in italiano — Vidapiena',
    description:
      'Tour a piedi nelle favelas di Rio — Rocinha, Vidigal, Tavares Bastos — e il city tour "Un Giorno a Rio" con Francesco, guida italiana a Rio de Janeiro da 9 anni. Gruppi piccoli, mototaxi incluso, da €52 a persona.',
    ogAlt: 'Il logo Vidapiena dipinto con lo spray su un muro di Rio',
  },

  a11y: {
    skipToContent: 'Salta al contenuto',
    langLabel: 'Lingua',
    heroVideoLabel: 'Il logo Vidapiena viene dipinto con lo spray su un muro di Rio',
    introLabel: 'Animazione di apertura',
    breadcrumbLabel: 'Percorso',
  },

  intro: {
    skip: 'Salta',
  },

  nav: {
    home: 'Home',
    tours: 'Tour',
    blog: 'Blog',
    guide: 'La guida',
    contact: 'Contatti',
    menuLabel: 'Menu principale',
    footerLabel: 'Mappa del sito',
    open: 'Apri il menu',
    close: 'Chiudi il menu',
  },

  /* Le due parole grandi restano in portoghese: voce del brand, identiche nelle
     due lingue. Il titolo leggibile qui sotto è quello che conta per SEO e
     screen reader. */
  community: {
    eyebrow: 'A comunidade',
    heading: 'La vita vera della comunità.',
  },

  hero: {
    kicker: 'Rocinha · Vidigal · Tavares Bastos · Un Giorno a Rio',
    h1: ['Favela tour a Rio de Janeiro,', 'in italiano.'],
    sub: 'Sono Francesco, guida italiana a Rio de Janeiro da 9 anni: ti porto a piedi dentro la vita vera della comunità. Gruppi piccoli, mototaxi incluso, da €52 a persona.',
    ctaTours: 'Scopri i tour',
    otaLabel: 'Mi trovi anche su',
    scrollCue: 'Scorri per esplorare',
    /* Anello orbitante dello sticker (decorativo, aria-hidden). Esattamente
       35 caratteri: il tracking del ring è calibrato su questa lunghezza. */
    orbit: 'GUIDA ITALIANA A RIO · VIDAPIENA · ',
  },

  guide: {
    heading: 'La guida',
    intro:
      'Sono Francesco: italiano, carioca d’adozione da 9 anni. Vidapiena è il mio modo di vivere questa città — e di fartela attraversare davvero, non solo guardare.',
    photoAlt: 'Francesco, guida italiana a Rio de Janeiro, davanti al Cristo Redentore',
    stats: [
      { k: 'Guida', v: 'Italiano madrelingua' },
      { k: 'A Rio da', v: '9 anni' },
      { k: 'Lingue tour', v: 'IT · EN · PT' },
      { k: 'Gruppi', v: 'Piccoli, min 2 persone' },
      { k: 'Incluso', v: 'Mototaxi + tassa comunitaria' },
    ],
    aboutCta: 'La mia storia →',
  },

  tours: {
    heading: 'I quattro tour',
    sub: 'Partenze ogni giorno · minimo 2 persone',
    from: 'da',
    perPerson: 'a persona',
    hours: (h: number) => (h === 2.5 ? '2 ore e 30' : `${h} ore`),
    maxPeople: (n: number) => `max ${n} persone`,
    ctaDetail: 'Scopri il tour',
    items: {
      rocinha: {
        name: 'Favela Tour Rocinha',
        hook: 'La favela più grande del Brasile: la galleria di un artista di graffiti nato qui, il campetto ristrutturato da un calciatore di Rocinha e una onlus italiana attiva nella comunità da oltre 20 anni.',
        /* Nessun prezzo bambini alla Rocinha (rimosso 01/09/2026) → nota vuota. */
        note: '',
      },
      vidigal: {
        name: 'Favela Tour Vidigal',
        hook: 'Salita in mototaxi, discesa tra i vicoli e gran finale al bar con terrazza panoramica di fronte al Cristo Redentore.',
        note: '',
      },
      tavares: {
        name: 'Favela Tour Tavares Bastos',
        hook: 'La comunità più tranquilla del centro: storie di quotidianità e una partita sull’iconico campetto di FIFA Street.',
        note: '',
      },
      giorno: {
        name: 'Un Giorno a Rio',
        hook: 'Cristo Redentore, Santa Teresa, Scalinata Selarón e Pan di Zucchero in una sola giornata: auto o van privato con autista, pick-up in hotel, pranzo a buffet incluso.',
        note: 'Giornata intera · tutto incluso',
      },
    },
  },

  /* Le pagine di dettaglio dei 4 tour. Solo fatti verificati su note tours.md. */
  tourPage: {
    breadcrumbTours: 'Tour',
    factsDuration: 'Durata',
    factsGroup: 'Gruppo',
    factsLanguages: 'Lingue',
    factsMeeting: 'Punto d’incontro',
    factsPrice: 'Prezzo',
    groupValue: (min: number, max: number) => `min ${min} · max ${max} persone`,
    languagesValue: 'IT · EN · PT',
    highlightsHeading: 'Cosa vediamo',
    galleryHeading: 'Dal tour',
    galleryCount: (n: number) => (n === 1 ? '1 fotografia' : `${n} fotografie`),
    galleryPrev: 'Foto precedente',
    galleryNext: 'Foto successiva',
    /** Live-region + progress-dot label. %c = current, %t = total. */
    galleryPosition: 'Foto %c di %t',
    galleryHint: 'Trascina o usa le frecce',
    practicalHeading: 'Informazioni pratiche',
    includesHeading: 'Incluso nel prezzo',
    priceHeading: 'Prezzi',
    tierLabel: (min: number, max: number) => `${min}–${max} persone`,
    bookingHeading: 'Prenota questo tour',
    instagramDm: 'Scrivimi su Instagram',
    otherToursHeading: 'Gli altri tour',
    fromBlog: 'Dal blog',
    faqHeading: 'Domande frequenti',
    /* Q&A condivise da tutti i tour — scritte per essere citate così come sono
       (da Google e dagli assistenti AI). Le domande specifiche del singolo tour,
       con i numeri reali, vivono in items[id].faq. */
    faqCommon: [
      {
        q: 'È sicuro visitare una favela?',
        a: 'Sì, con una guida che conosce la comunità. Cammino queste strade da 9 anni e conosco le persone: entriamo solo dove siamo i benvenuti. Ti dico sempre dove siamo e come comportarci, niente foto alle persone senza chiedere. Gruppi piccoli, ritmo tranquillo.',
      },
      {
        q: 'È un tour etico?',
        a: 'Non è uno zoo umano. Entriamo con rispetto e parte di quello che paghi resta nella comunità: i mototaxi dei ragazzi locali, la tassa comunitaria, le famiglie e gli artisti che incontriamo. Racconto la vita vera, senza spettacolarizzare la povertà.',
      },
      {
        q: 'Posso fare foto?',
        a: 'Sì, ma non alle persone senza chiedere prima. Panorami e muri dipinti sempre; persone e case solo con il loro permesso. Te lo indico man mano lungo il percorso.',
      },
      {
        q: 'Va bene per bambini e famiglie?',
        a: 'Sì, il ritmo si adatta al gruppo; per i più piccoli valutiamo insieme il mototaxi.',
      },
      {
        q: 'Cosa porto e come mi vesto?',
        a: 'Scarpe comode chiuse (si cammina in discesa su strade e scale irregolari), acqua e un po’ di contanti per un caffè o l’artigianato locale. Vestiti comodi, niente di appariscente; cappello e crema solare nei giorni di sole.',
      },
      {
        q: 'Come prenoto?',
        a: 'Prenoti con me: scrivimi su WhatsApp o in DM su Instagram (@vidapiena) e sistemiamo insieme data e disponibilità, su misura per te. Mi trovi anche su Viator, GetYourGuide, Airbnb e Civitatis.',
      },
      {
        q: 'E se piove o devo cancellare?',
        a: 'Con maltempo forte concordiamo insieme un’altra data. Per date, modifiche o cancellazioni scrivimi direttamente su WhatsApp o Instagram; il minimo è 2 persone.',
      },
    ],
    items: {
      rocinha: {
        metaTitle: 'Favela Tour Rocinha — 3 ore con guida italiana | Vidapiena',
        metaDescription:
          'Tour a piedi di 3 ore nella Rocinha, la favela più grande del Brasile, con Francesco, guida italiana a Rio: mototaxi fino in cima, vista panoramica, la galleria di un artista di graffiti e una onlus italiana. €52 a persona.',
        kicker: 'Favela tour · 3 ore',
        longDesc: [
          'La Rocinha è la favela più grande del Brasile: una città nella città, appoggiata alla montagna sopra São Conrado. Il tour comincia in sella ai mototaxi dei ragazzi locali, che ci portano fin sulla cima — da lì si scende a piedi, dentro la vita vera della comunità.',
          'Lungo la discesa entriamo nella casa di una famiglia locale, visitiamo la galleria di un artista di graffiti nato e cresciuto qui e passiamo dal campetto ristrutturato da un calciatore di Rocinha. Chiudiamo con una onlus italiana attiva nella comunità da oltre 20 anni.',
          'Racconto tutto in italiano — o in inglese e portoghese se il gruppo è misto. Gruppi piccoli, ritmo umano, nessuna messa in scena.',
        ],
        highlights: [
          'La salita in mototaxi fin sulla cima della favela',
          'La vista panoramica su Cristo, Lagoa, Pan di Zucchero e le spiagge',
          'La casa di una famiglia della comunità',
          'La galleria di un artista di graffiti nato alla Rocinha',
          'Il campetto ristrutturato da un calciatore di Rocinha',
          'La onlus italiana attiva qui da oltre 20 anni',
        ],
        includes: [
          'Mototaxi fino in cima',
          'Tassa di visita alla comunità',
          'Guida in italiano, inglese o portoghese',
        ],
        meetingNote: 'Av. Niemeyer 780, São Conrado (Igreja Universal). Il tour inizia e finisce nello stesso punto.',
        faq: [
          {
            q: 'Dove e quando ci incontriamo?',
            a: 'Ci troviamo in Av. Niemeyer 780, São Conrado, davanti all’Igreja Universal. Il tour inizia e finisce nello stesso punto e dura circa 3 ore. Partenze ogni giorno, minimo 2 persone.',
          },
          {
            q: 'Cosa è incluso nel prezzo?',
            a: '€52 a persona. Include il mototaxi fino in cima, la tassa di visita alla comunità e la guida in italiano, inglese o portoghese.',
          },
          {
            q: 'Quanto si cammina?',
            a: 'Si sale in mototaxi fino in cima e si scende a piedi: circa 3 ore in discesa su strade e scale irregolari. Consigliate scarpe comode chiuse.',
          },
        ],
      },
      vidigal: {
        metaTitle: 'Favela Tour Vidigal — 2 ore e 30 con guida italiana | Vidapiena',
        metaDescription:
          'Tour a piedi di 2 ore e 30 nel Vidigal con Francesco, guida italiana a Rio: salita in mototaxi, la vista su Leblon e Ipanema, la discesa tra i vicoli e la terrazza panoramica di fronte al Cristo Redentore. €52 a persona.',
        kicker: 'Favela tour · 2 ore e 30',
        longDesc: [
          'Il Vidigal è la favela affacciata sul mare, tra Leblon e la pietra dei Dois Irmãos. Si sale in mototaxi fino alla parte alta — riqualificata, con il campetto e il parco — e poi si scende a piedi, vicolo per vicolo.',
          'Lungo la strada ci fermiamo in un bar con una delle viste più belle della città: Leblon, Ipanema e il Pan di Zucchero in un unico sguardo. Il gran finale è una terrazza panoramica di fronte al Cristo Redentore.',
        ],
        highlights: [
          'La salita in mototaxi fino all’alto Vidigal',
          'Il campetto e il parco della parte alta riqualificata',
          'Il bar con vista su Leblon, Ipanema e Pan di Zucchero',
          'La discesa a piedi tra i vicoli della comunità',
          'La terrazza finale di fronte al Cristo Redentore',
        ],
        includes: [
          'Mototaxi fino in cima',
          'Tassa di visita alla comunità',
          'Guida in italiano, inglese o portoghese',
        ],
        meetingNote: 'Praça do Vidigal, all’ingresso della comunità.',
        faq: [
          {
            q: 'Dove e quando ci incontriamo?',
            a: 'Ci troviamo in Praça do Vidigal, all’ingresso della comunità. Il tour dura circa 2 ore e 30. Partenze ogni giorno, minimo 2 persone.',
          },
          {
            q: 'Cosa è incluso nel prezzo?',
            a: '€52 a persona. Include il mototaxi fino all’alto Vidigal, la tassa di visita alla comunità e la guida in italiano, inglese o portoghese.',
          },
          {
            q: 'Qual è la vista migliore?',
            a: 'Ci fermiamo in un bar con Leblon, Ipanema e il Pan di Zucchero in un unico sguardo, e chiudiamo su una terrazza panoramica di fronte al Cristo Redentore. È il tour del tramonto per eccellenza.',
          },
        ],
      },
      tavares: {
        metaTitle: 'Favela Tour Tavares Bastos — 2 ore e 30 con guida italiana | Vidapiena',
        metaDescription:
          'Tour a piedi di 2 ore e 30 a Tavares Bastos, la comunità più tranquilla del centro di Rio, con Francesco, guida italiana: vicoli, vita quotidiana e una partita sull’iconico campetto di FIFA Street. €52 a persona.',
        kicker: 'Favela tour · 2 ore e 30',
        longDesc: [
          'Tavares Bastos è la comunità più tranquilla del centro di Rio, arrampicata sopra il quartiere di Catete. Si sale in mototaxi e si scende a piedi, tra vicoli, botteghe e storie di quotidianità.',
          'Il momento più famoso è il campetto di FIFA Street — sì, proprio quello: una partita lì è d’obbligo. Intorno, la vita vera della comunità e scorci che dal centro non ti aspetti.',
        ],
        highlights: [
          'La salita in mototaxi e la discesa a piedi tra i vicoli',
          'La vita quotidiana e il commercio locale della comunità',
          'Una partita sull’iconico campetto di FIFA Street',
          'Gli scorci sul centro e sulla baia',
        ],
        includes: [
          'Mototaxi fino in cima',
          'Tassa di visita alla comunità',
          'Guida in italiano, inglese o portoghese',
        ],
        meetingNote: 'Rua Bento Lisboa 72, Catete.',
        faq: [
          {
            q: 'Dove e quando ci incontriamo?',
            a: 'Ci troviamo in Rua Bento Lisboa 72, Catete. Il tour dura circa 2 ore e 30. Partenze ogni giorno, minimo 2 persone.',
          },
          {
            q: 'Cosa è incluso nel prezzo?',
            a: '€52 a persona. Include il mototaxi e la guida in italiano, inglese o portoghese. Tavares Bastos è la comunità più tranquilla del centro di Rio.',
          },
          {
            q: 'Si gioca davvero sul campetto di FIFA Street?',
            a: 'Sì: l’iconico campetto di FIFA Street è qui e una partita è quasi d’obbligo. Intorno, la vita quotidiana della comunità e scorci sul centro e sulla baia.',
          },
        ],
      },
      giorno: {
        metaTitle: 'Un Giorno a Rio — city tour con guida italiana | Vidapiena',
        metaDescription:
          'Una giornata intera tra Cristo Redentore, Santa Teresa, Scalinata Selarón e Pan di Zucchero con Francesco, guida italiana: auto o van privato con autista, pick-up in hotel, trenino del Corcovado, funivia e pranzo a buffet. €207 a persona, con tariffa ridotta per i gruppi.',
        kicker: 'City tour · giornata intera',
        longDesc: [
          'Il meglio di Rio in una sola giornata, senza pensieri: ti vengo a prendere in hotel con auto o van privato con autista, e da lì si parte — il Cristo Redentore con il trenino del Corcovado, il quartiere bohémien di Santa Teresa, la Scalinata Selarón e il Pan di Zucchero in funivia.',
          'È il tour premium di Vidapiena: 8 ore (9 con il pranzo a buffet), tutto organizzato e tutto incluso — trasporti, biglietti e racconto in italiano. Il prezzo scende al crescere del gruppo: da €207 a persona in 2-3 fino a €136 da 7 in su, sempre tutto incluso.',
        ],
        highlights: [
          'Il Cristo Redentore con il trenino del Corcovado',
          'Santa Teresa e la Scalinata Selarón',
          'Il Pan di Zucchero in funivia',
          'Auto o van privato con autista e pick-up in hotel',
          'Pranzo a buffet incluso (bevande escluse)',
        ],
        includes: [
          'Auto o van privato con autista',
          'Pick-up e rientro in hotel',
          'Trenino del Corcovado e funivia del Pan di Zucchero',
          'Pranzo a buffet (bevande escluse)',
          'Guida in italiano, inglese o portoghese',
        ],
        meetingNote: 'Pick-up direttamente nel tuo hotel, ovunque a Rio. Fatti trovare pronto circa 30 minuti prima.',
        faq: [
          {
            q: 'Dove e quando ci incontriamo?',
            a: 'Ti vengo a prendere direttamente in hotel, ovunque a Rio. La giornata dura circa 8 ore (9 con il pranzo); fatti trovare pronto circa 30 minuti prima. Partenze ogni giorno, minimo 2 persone.',
          },
          {
            q: 'Quanto costa e come funziona il prezzo?',
            a: 'Il prezzo è a persona e scende al crescere del gruppo: €207 in 2-3 persone, €156 da 4 a 6, €136 da 7 a 15. Include auto o van privato con autista, biglietti, trenino del Corcovado, funivia del Pan di Zucchero e pranzo a buffet (bevande escluse).',
          },
          {
            q: 'Cosa vediamo in una giornata?',
            a: 'Il Cristo Redentore con il trenino del Corcovado, il quartiere di Santa Teresa, la Scalinata Selarón e il Pan di Zucchero in funivia. Tutto organizzato, con pick-up e rientro in hotel.',
          },
        ],
      },
    },
  },

  about: {
    metaTitle: 'La guida — Francesco, italiano a Rio de Janeiro | Vidapiena',
    metaDescription:
      'Francesco è una guida italiana a Rio de Janeiro da 9 anni: favela tour a Rocinha, Vidigal e Tavares Bastos e il city tour "Un Giorno a Rio", in italiano, inglese e portoghese.',
    kicker: 'La guida',
    heading: 'Francesco. Italiano, carioca d’adozione.',
    story: [
      'Sono Francesco, italiano, e vivo a Rio de Janeiro da 9 anni. Vidapiena — "vita piena" — è il nome che ho dato al mio modo di stare qui: dentro la città, non davanti.',
      'Accompagno persone nelle comunità di Rocinha, Vidigal e Tavares Bastos, e in giro per la città con "Un Giorno a Rio". Tour a piedi, gruppi piccoli, mototaxi incluso: si sale in moto e si scende camminando, fermandosi dove la vita succede.',
      'Guido in italiano — la mia lingua — e in inglese e portoghese quando il gruppo è misto. Le storie che racconto vengono dalle persone che conosco: famiglie, artisti, chi nella comunità ci è nato.',
    ],
    /* Frase "mi trovi anche su …" — resa con link reali alle piattaforme in
       AboutPage.astro (i nomi non ancora collegati restano testo semplice). */
    platforms: {
      lead: 'Mi trovi anche su',
      and: 'e',
      instagramLead: 'o su',
      tail: ', dove racconto Rio ogni giorno.',
    },
    /* Solo nella sezione "La guida", mai in home: sono informazioni specifiche.
       "Polizza infortuni" (copertura dei partecipanti), NON responsabilità civile. */
    trust: {
      heading: 'Garanzie',
      items: [
        'I partecipanti sono coperti da una polizza infortuni (Porto Seguro).',
        'Attività registrata come MEI, l’impresa individuale brasiliana (CNPJ).',
      ],
    },
    ctaTours: 'Scopri i tour',
    ctaContact: 'Contatti',
  },

  contact: {
    metaTitle: 'Contatti — Francesco, guida italiana a Rio | Vidapiena',
    metaDescription:
      'Contatta Francesco di Vidapiena: prenota i tour con lui su WhatsApp o in DM su Instagram, per un servizio personalizzato e su misura. Lo trovi anche su Viator, GetYourGuide, Airbnb e Civitatis.',
    kicker: 'Contatti',
    heading: 'Prenota direttamente con me.',
    instagramLead:
      'Il modo più diretto per prenotare o chiedermi informazioni è scrivermi su WhatsApp o in DM su Instagram: rispondo in italiano, inglese o portoghese.',
    instagramCta: 'Scrivimi su Instagram',
    bookingHeading: 'Prenotazioni',
    bookingLead:
      'Prenoti con me: scrivimi su WhatsApp o in DM su Instagram e sistemiamo data e disponibilità, su misura per te. Mi trovi anche sulle piattaforme qui sotto.',
    logisticsHeading: 'Buono a sapersi',
    logisticsItems: [
      'Partenze ogni giorno · minimo 2 persone.',
      'Ogni favela tour parte dal punto d’incontro ai piedi della comunità; "Un Giorno a Rio" prevede il pick-up in hotel.',
      'Mototaxi e tassa di visita alla comunità sono inclusi nei favela tour.',
    ],
  },

  blog: {
    metaTitle: 'Blog — storie da Rio de Janeiro | Vidapiena',
    metaDescription:
      'Storie, consigli e vita quotidiana da Rio de Janeiro raccontati da Francesco, guida italiana: le comunità, i quartieri e la cultura carioca.',
    kicker: 'Blog',
    heading: 'Storie da Rio.',
    empty: 'Primi racconti in arrivo.',
    emptySub:
      'Sto scrivendo i primi articoli: storie dalle comunità, consigli pratici e vita carioca. Nel frattempo mi trovi su Instagram.',
    readMore: 'Leggi',
    backToBlog: '← Tutti gli articoli',
    updatedOn: 'Aggiornato il',
    related: 'Continua a leggere',
    relatedTour: 'Il tour di questo racconto',
    /** Plural form: an article that belongs to more than one tour (see
     *  EXTRA_TOUR_POSTS in src/data/related.ts) heads its block with this. */
    relatedTours: 'I tour di questo racconto',
  },

  instagram: {
    kicker: '@vidapiena',
    heading: 'Rio, ogni giorno, su Instagram.',
    sub: 'Storie dalle comunità, dietro le quinte dei tour e la vita carioca di tutti i giorni.',
    cta: 'Seguimi su', // brand word rendered as the Instagram glyph in InstagramBand's CTA
    /* Secondo CTA della band: stessa forma, glifo TikTok al posto del nome. */
    tiktokCta: 'Guardami su',
  },

  /* Rassegna esterna — chi parla di Vidapiena fuori da questo sito. I fatti (URL,
     testata, aggregati) stanno in src/data/mentions.ts: qui solo la cornice
     localizzata, una voce in `items` per ogni chiave di MENTIONS. Le voci con un
     `rating` nei dati diventano card-statistica e usano statLabel; le altre
     usano quote. `outlet` NON si traduce: vive nei dati. */
  press: {
    eyebrow: 'Rassegna',
    heading: 'Non solo parole mie.',
    sub: 'Testate, guide e assistenti di viaggio che raccontano Vidapiena — fonti esterne, verificabili in un clic.',
    prev: 'Menzione precedente',
    next: 'Menzione successiva',
    items: {
      voglioVivereCosi: {
        kind: 'Intervista',
        meta: 'aprile 2026',
        quote: 'In Brasile c’è amore per la vita.',
        lead: 'Il magazine italiano Voglio Vivere Così — dedicato a chi sogna di cambiare vita e trasferirsi all’estero — ha raccontato la mia storia: perché ho lasciato Milano per Rio e come vivo oggi nel Vidigal.',
        cta: 'Leggi l’intervista →',
      },
      wanderboat: {
        kind: 'Guida di viaggio AI',
        meta: 'scheda locale · Vidigal',
        statLabel: (n: number) => `${n} recensioni`,
        lead: 'Wanderboat, l’assistente di viaggio che suggerisce cosa fare in città, ha schedato Vidapiena tra le attività del Vidigal: contatti, orari e le recensioni di chi è già venuto.',
        cta: 'Apri la scheda →',
      },
    },
  },

  finalCta: {
    heading: 'Pronti a scoprire la vera Rio?',
    sub: 'Quattro tour, partenze ogni giorno, racconto in italiano. Scegli il tuo e ci vediamo a Rio.',
    ctaTours: 'Scopri i tour',
    instagramLabel: 'Seguimi su Instagram',
    tiktokLabel: 'Seguimi su TikTok',
  },

  /* Recensioni Google reali come prova sociale (layer statico curato). Il testo
     delle recensioni vive in src/data/reviews.ts — indipendente dalla lingua:
     sono parole vere dei clienti, non si traducono. Qui solo la cornice. */
  testimonials: {
    eyebrow: 'Recensioni',
    heading: 'Cosa dicono i viaggiatori.',
    sub: 'Le parole di chi ha già camminato con me nelle comunità di Rio.',
    rated: (n: number) => `5,0 su 5 · ${n} recensioni su Google`,
    source: 'da Google',
    cta: 'Leggi tutte le recensioni su Google →',
  },

  /* Prenotazione diretta (decisione cliente 19/08/2026): WhatsApp + Instagram,
     niente commissioni. waPrefillTour è una funzione: la forma dev'essere
     identica in en.ts (contratto `typeof it`). */
  booking: {
    lead: 'Prenoti con me, per un servizio personalizzato e su misura: scrivimi su WhatsApp o in DM su Instagram e sistemiamo data e disponibilità. Le piattaforme restano solo come vetrina.',
    waCta: 'Prenota su WhatsApp',
    waPrefillTour: (name: string) =>
      `Ciao Francesco! Vorrei prenotare il tour "${name}". Mi dici date e disponibilità?`,
    waPrefillGeneric: 'Ciao Francesco! Vorrei qualche informazione sui tuoi tour a Rio.',
    /* Calendario Bókun (05/09/2026): richiesta di prenotazione, non checkout —
       il canale è su "pay on arrival", nessun pagamento con carta sul sito. */
    calendarHeading: 'Guarda le date libere',
    calendarLead:
      'Scegli il giorno e mandami la richiesta. Nessun pagamento online: ti confermo io personalmente e sistemiamo insieme il saldo.',
    calendarNoscript:
      'Attiva JavaScript per vedere il calendario, oppure scrivimi direttamente su WhatsApp.',
  },

  badges: {
    heading: 'Mi trovi anche su',
  },

  /* La rotta della discesa — i waypoint del binario laterale (304 m → 0 m). */
  route: {
    seaLevel: 'livello del mare',
  },

  footer: {
    line: 'Vidapiena — Francesco, guida italiana a Rio de Janeiro.',
    langNames: { it: 'Italiano', en: 'English' },
  },
};
