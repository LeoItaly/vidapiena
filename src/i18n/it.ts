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
      'Tour a piedi nelle favelas di Rio — Rocinha, Vidigal, Tavares Bastos — e il city tour "Un Giorno a Rio" con Francesco, guida italiana a Rio de Janeiro da 9 anni. Gruppi piccoli, mototaxi incluso, da R$270 a persona.',
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
    sub: 'Sono Francesco, guida italiana a Rio de Janeiro da 9 anni: ti porto a piedi dentro la vita vera della comunità. Gruppi piccoli, mototaxi incluso, da R$270 a persona.',
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
    photoAlt: 'Francesco, guida italiana a Rio de Janeiro',
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
        note: 'Bambini fino a 12 anni: R$180',
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
        hook: 'Cristo Redentore, Santa Teresa, Scalinata Selarón e Pan di Zucchero in una sola giornata: auto privata con autista, pick-up in hotel, pranzo a buffet incluso.',
        note: 'Giornata intera · prezzo a scaglioni per gruppo',
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
    practicalHeading: 'Informazioni pratiche',
    includesHeading: 'Incluso nel prezzo',
    priceHeading: 'Prezzi',
    tierLabel: (min: number, max: number) => `${min}–${max} persone`,
    bookingHeading: 'Prenota questo tour',
    bookingLive: 'Prenota su una di queste piattaforme:',
    bookingSoon: 'Prenotazione online in arrivo.',
    bookingSoonSub:
      'Le prenotazioni apriranno a breve su Airbnb, Viator, GetYourGuide e Civitatis. Nel frattempo scrivimi in DM su Instagram per date e disponibilità.',
    instagramDm: 'Scrivimi su Instagram',
    otherToursHeading: 'Gli altri tour',
    items: {
      rocinha: {
        metaTitle: 'Favela Tour Rocinha — 3 ore con guida italiana | Vidapiena',
        metaDescription:
          'Tour a piedi di 3 ore nella Rocinha, la favela più grande del Brasile, con Francesco, guida italiana a Rio: mototaxi fino in cima, vista panoramica, la galleria di un artista di graffiti e una onlus italiana. R$270 a persona.',
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
      },
      vidigal: {
        metaTitle: 'Favela Tour Vidigal — 2 ore e 30 con guida italiana | Vidapiena',
        metaDescription:
          'Tour a piedi di 2 ore e 30 nel Vidigal con Francesco, guida italiana a Rio: salita in mototaxi, la vista su Leblon e Ipanema, la discesa tra i vicoli e la terrazza panoramica di fronte al Cristo Redentore. R$270 a persona.',
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
      },
      tavares: {
        metaTitle: 'Favela Tour Tavares Bastos — 2 ore e 30 con guida italiana | Vidapiena',
        metaDescription:
          'Tour a piedi di 2 ore e 30 a Tavares Bastos, la comunità più tranquilla del centro di Rio, con Francesco, guida italiana: vicoli, vita quotidiana e una partita sull’iconico campetto di FIFA Street. R$270 a persona.',
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
      },
      giorno: {
        metaTitle: 'Un Giorno a Rio — city tour con guida italiana | Vidapiena',
        metaDescription:
          'Una giornata intera tra Cristo Redentore, Santa Teresa, Scalinata Selarón e Pan di Zucchero con Francesco, guida italiana: auto privata con autista, pick-up in hotel, trenino del Corcovado, funivia e pranzo a buffet. Da R$780 a persona.',
        kicker: 'City tour · giornata intera',
        longDesc: [
          'Il meglio di Rio in una sola giornata, senza pensieri: ti vengo a prendere in hotel con auto privata e autista, e da lì si parte — il Cristo Redentore con il trenino del Corcovado, il quartiere bohémien di Santa Teresa, la Scalinata Selarón e il Pan di Zucchero in funivia.',
          'È il tour premium di Vidapiena: 8 ore (9 con il pranzo a buffet), tutto organizzato e tutto incluso — trasporti, biglietti e racconto in italiano. Il prezzo a persona scende all’aumentare del gruppo.',
        ],
        highlights: [
          'Il Cristo Redentore con il trenino del Corcovado',
          'Santa Teresa e la Scalinata Selarón',
          'Il Pan di Zucchero in funivia',
          'Auto privata con autista e pick-up in hotel',
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
      'Mi trovi anche su Airbnb, Viator, GetYourGuide e Civitatis — o su Instagram, dove racconto Rio ogni giorno.',
    ],
    ctaTours: 'Scopri i tour',
    ctaContact: 'Contatti',
  },

  contact: {
    metaTitle: 'Contatti — Francesco, guida italiana a Rio | Vidapiena',
    metaDescription:
      'Contatta Francesco di Vidapiena: scrivigli in DM su Instagram per date e disponibilità, oppure prenota i tour su Airbnb, Viator, GetYourGuide e Civitatis.',
    kicker: 'Contatti',
    heading: 'Parliamone su Instagram.',
    instagramLead:
      'Il modo più diretto per scrivermi è un DM su Instagram: rispondo in italiano, inglese o portoghese.',
    instagramCta: 'Scrivimi su Instagram',
    bookingHeading: 'Prenotazioni',
    bookingLead: 'I tour si prenotano online sulle piattaforme:',
    logisticsHeading: 'Buono a sapersi',
    logisticsItems: [
      'Partenze ogni giorno · minimo 2 persone ("Un Giorno a Rio": prezzo a scaglioni per gruppo).',
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
  },

  instagram: {
    kicker: '@vidapiena',
    heading: 'Rio, ogni giorno, su Instagram.',
    sub: 'Storie dalle comunità, dietro le quinte dei tour e la vita carioca di tutti i giorni.',
    cta: 'Seguimi su Instagram',
  },

  finalCta: {
    heading: 'Pronti a scoprire la vera Rio?',
    sub: 'Quattro tour, partenze ogni giorno, racconto in italiano. Scegli il tuo e ci vediamo a Rio.',
    ctaTours: 'Scopri i tour',
    instagramLabel: 'Seguimi su Instagram',
  },

  badges: {
    heading: 'Prenota Vidapiena anche su',
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
