/**
 * Copy — English (secondary locale). Mirrors the shape of `it.ts` (type-checked).
 * OTA convention respected: "guided in Italian by a native speaker" is explicit,
 * and tours also run in English and Portuguese.
 */
import type { it } from './it';

export const en: typeof it = {
  meta: {
    title: 'Favela tours in Rio de Janeiro with an Italian guide — Vidapiena',
    description:
      'Walking tours of Rio’s favelas — Rocinha, Vidigal, Tavares Bastos — and the full-day "Un Giorno a Rio" city tour with Francesco, Italian guide in Rio de Janeiro for 9 years. Tours in English, Italian and Portuguese. Small groups, mototaxi included, from R$270 per person.',
    ogAlt: 'The Vidapiena logo spray-painted on a wall in Rio',
  },

  a11y: {
    skipToContent: 'Skip to content',
    langLabel: 'Language',
    heroVideoLabel: 'The Vidapiena logo being spray-painted on a wall in Rio',
  },

  hero: {
    kicker: 'Rocinha · Vidigal · Tavares Bastos · Un Giorno a Rio',
    h1: ['Favela tours in Rio de Janeiro,', 'with an Italian guide.'],
    sub: 'I’m Francesco — Italian, 9 years in Rio. I take you on foot through the real life of the community: small groups, mototaxi included, in English, Italian or Portuguese, from R$270 per person.',
    ctaTours: 'See the tours',
    otaLabel: 'Also on',
    scrollCue: 'Scroll to explore',
  },

  descentIntro: {
    kicker: 'The descent · 304 m → 0 m',
    h2: ['The view is just the beginning.', 'Rio happens on the way down.'],
    sub: 'A taste of the way down: from the lookout to the sea, zone by zone.',
  },

  zones: {
    mirante: {
      gloss: 'the lookout',
      fact: 'Voted one of the most beautiful views in Rio: Ipanema and Leblon beaches, the lagoon and Sugarloaf in a single frame.',
    },
    lajes: {
      gloss: 'the rooftops',
      fact: 'The lajes are the favela’s piazzas: weekend barbecues, kite battles, samba drifting up from the alleys.',
    },
    becos: {
      gloss: 'the alleys',
      fact: 'Roughly one carioca in five lives in a favela. Some alleys are no-photo out of respect: certain views you keep only in your memory.',
    },
    ladeira: {
      gloss: 'the climb',
      fact: '“We warm up the engines”: every tour opens riding local mototaxis to the very top, helmets on. Included in the price.',
    },
    asfalto: {
      gloss: 'sea level',
      fact: 'Every descent ends where Rio meets the sea: the beach ahead, the hill you just walked down behind you. This is where the tours start — on the asphalt.',
    },
  },

  guide: {
    heading: 'The guide',
    intro:
      'I’m Francesco: Italian, carioca by adoption for 9 years. Vidapiena is how I live this city — and how I take you through it, not just past it.',
    photoAlt: 'Francesco, Italian tour guide in Rio de Janeiro',
    stats: [
      { k: 'Guide', v: 'Italian native speaker' },
      { k: 'In Rio for', v: '9 years' },
      { k: 'Tour languages', v: 'EN · IT · PT' },
      { k: 'Groups', v: 'Small, min 2 people' },
      { k: 'Included', v: 'Mototaxi + community fee' },
    ],
  },

  tours: {
    heading: 'The four tours',
    sub: 'Departing daily · minimum 2 people',
    from: 'from',
    perPerson: 'per person',
    hours: (h: number) => (h === 2.5 ? '2.5 hours' : `${h} hours`),
    maxPeople: (n: number) => `max ${n} people`,
    bookWhatsapp: 'Book on WhatsApp',
    items: {
      rocinha: {
        name: 'Favela Tour Rocinha',
        hook: 'Brazil’s largest favela: the gallery of a graffiti artist born here, the pitch rebuilt by a footballer from Rocinha, and an Italian NGO working in the community for over 20 years.',
        note: 'Children up to 12: R$180',
      },
      vidigal: {
        name: 'Favela Tour Vidigal',
        hook: 'Mototaxi to the top, down through the alleys, and a grand finale at the terrace bar facing Christ the Redeemer.',
        note: '',
      },
      tavares: {
        name: 'Favela Tour Tavares Bastos',
        hook: 'Downtown’s most laid-back community: everyday stories and a game on the iconic FIFA Street pitch.',
        note: '',
      },
      giorno: {
        name: 'Un Giorno a Rio',
        hook: 'Christ the Redeemer, Santa Teresa, the Selarón Steps and Sugarloaf in a single day: private car with driver, hotel pick-up, buffet lunch included.',
        note: 'Full day · tiered pricing by group size',
      },
    },
  },

  tagline: 'One guide. Three languages. From R$270. Departing daily.',

  cta: {
    heading: 'Meet me at sea level.',
    sub: 'Every tour starts on the asphalt, at the foot of the hill. Write me for dates and availability — I reply in English, Italian or Portuguese.',
    whatsappButton: 'Message me on WhatsApp',
    whatsappPrefill: 'Hi Francesco! I found vidapiena and I’d like some info about the tours.',
    instagramLabel: 'Follow me on Instagram',
  },

  badges: {
    heading: 'Book Vidapiena also on',
  },

  footer: {
    line: 'Vidapiena — Francesco, Italian tour guide in Rio de Janeiro.',
    langNames: { it: 'Italiano', en: 'English' },
  },
};
