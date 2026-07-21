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
  },

  hero: {
    kicker: 'Rocinha · Vidigal · Tavares Bastos · Un Giorno a Rio',
    h1: ['Favela tour a Rio de Janeiro,', 'in italiano.'],
    sub: 'Sono Francesco, guida italiana a Rio de Janeiro da 9 anni: ti porto a piedi dentro la vita vera della comunità. Gruppi piccoli, mototaxi incluso, da R$270 a persona.',
    ctaTours: 'Scopri i tour',
    otaLabel: 'Mi trovi anche su',
    scrollCue: 'Scorri per esplorare',
  },

  /* La vecchia headline dell’hero: ora introduce la discesa, dove il senso è pieno. */
  descentIntro: {
    kicker: 'La discesa · 304 m → 0 m',
    h2: ['La vista è solo l’inizio.', 'Rio si vive scendendo.'],
    sub: 'Un assaggio di come si scende: dal mirante al mare, zona per zona.',
  },

  zones: {
    mirante: {
      gloss: 'il belvedere',
      fact: 'Eletta una delle viste più belle di Rio: le spiagge di Ipanema e Leblon, la Lagoa e il Pan di Zucchero in un unico sguardo.',
    },
    lajes: {
      gloss: 'i tetti',
      fact: 'Le lajes sono le piazze della favela: churrasco nel weekend, battaglie di aquiloni, samba che sale dai vicoli.',
    },
    becos: {
      gloss: 'i vicoli',
      fact: 'Circa un carioca su cinque vive in una favela. In alcuni vicoli non si fotografa, per rispetto: certe viste restano solo nella memoria.',
    },
    ladeira: {
      gloss: 'la salita',
      fact: '«Scaldiamo subito i motori»: ogni tour comincia in sella ai mototaxi dei ragazzi locali, casco in testa, fin sulla cima. Incluso nel prezzo.',
    },
    asfalto: {
      gloss: 'il livello del mare',
      fact: 'Ogni discesa finisce dove Rio incontra il mare: davanti la spiaggia, alle spalle il morro appena disceso. È qui, sull’asfalto, che partono i tour.',
    },
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
  },

  tours: {
    heading: 'I quattro tour',
    sub: 'Partenze ogni giorno · minimo 2 persone',
    from: 'da',
    perPerson: 'a persona',
    hours: (h: number) => (h === 2.5 ? '2 ore e 30' : `${h} ore`),
    maxPeople: (n: number) => `max ${n} persone`,
    bookWhatsapp: 'Prenota su WhatsApp',
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

  tagline: 'Una guida. Tre lingue. Da R$270. Partenze ogni giorno.',

  cta: {
    heading: 'Ci vediamo al livello del mare.',
    sub: 'Ogni tour parte dall’asfalto, ai piedi del morro. Scrivimi per date e disponibilità — rispondo in italiano, inglese o portoghese.',
    whatsappButton: 'Scrivimi su WhatsApp',
    whatsappPrefill: 'Ciao Francesco! Ho visto vidapiena e vorrei informazioni sui tour.',
    instagramLabel: 'Seguimi su Instagram',
  },

  badges: {
    heading: 'Prenota Vidapiena anche su',
  },

  footer: {
    line: 'Vidapiena — Francesco, guida italiana a Rio de Janeiro.',
    langNames: { it: 'Italiano', en: 'English' },
  },
};
