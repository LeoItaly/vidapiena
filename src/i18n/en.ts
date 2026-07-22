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
    introLabel: 'Opening animation',
    breadcrumbLabel: 'Breadcrumb',
  },

  intro: {
    skip: 'Skip',
  },

  nav: {
    home: 'Home',
    tours: 'Tours',
    blog: 'Blog',
    guide: 'The guide',
    contact: 'Contact',
    menuLabel: 'Main menu',
    footerLabel: 'Site map',
    open: 'Open menu',
    close: 'Close menu',
  },

  community: {
    eyebrow: 'A comunidade',
    heading: 'The real life of the community.',
  },

  hero: {
    kicker: 'Rocinha · Vidigal · Tavares Bastos · Un Giorno a Rio',
    h1: ['Favela tours in Rio de Janeiro,', 'with an Italian guide.'],
    sub: 'I’m Francesco — Italian, 9 years in Rio. I take you on foot through the real life of the community: small groups, mototaxi included, in English, Italian or Portuguese, from R$270 per person.',
    ctaTours: 'See the tours',
    otaLabel: 'Also on',
    scrollCue: 'Scroll to explore',
    /* Sticker orbit ring (decorative, aria-hidden). Exactly 35 characters —
       the ring's tracking is calibrated to this length. */
    orbit: 'ITALIAN GUIDE IN RIO · VIDAPIENA · ',
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
    aboutCta: 'My story →',
  },

  tours: {
    heading: 'The four tours',
    sub: 'Departing daily · minimum 2 people',
    from: 'from',
    perPerson: 'per person',
    hours: (h: number) => (h === 2.5 ? '2.5 hours' : `${h} hours`),
    maxPeople: (n: number) => `max ${n} people`,
    ctaDetail: 'See the tour',
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
        hook: 'Christ the Redeemer, Santa Teresa, the Selarón Steps and Sugarloaf in a single day: private car or van with driver, hotel pick-up, buffet lunch included.',
        note: 'Full day · tiered pricing by group size',
      },
    },
  },

  /* The 4 tour detail pages. Verified facts from note tours.md only. */
  tourPage: {
    breadcrumbTours: 'Tours',
    factsDuration: 'Duration',
    factsGroup: 'Group',
    factsLanguages: 'Languages',
    factsMeeting: 'Meeting point',
    factsPrice: 'Price',
    groupValue: (min: number, max: number) => `min ${min} · max ${max} people`,
    languagesValue: 'EN · IT · PT',
    highlightsHeading: 'What we see',
    galleryHeading: 'From the tour',
    galleryCount: (n: number) => (n === 1 ? '1 photograph' : `${n} photographs`),
    practicalHeading: 'Practical info',
    includesHeading: 'Included in the price',
    priceHeading: 'Prices',
    tierLabel: (min: number, max: number) => `${min}–${max} people`,
    bookingHeading: 'Book this tour',
    bookingLive: 'Book on one of these platforms:',
    bookingSoon: 'Online booking coming soon.',
    bookingSoonSub:
      'Bookings are opening shortly on Airbnb, Viator, GetYourGuide and Civitatis. In the meantime, DM me on Instagram for dates and availability.',
    instagramDm: 'Message me on Instagram',
    otherToursHeading: 'The other tours',
    items: {
      rocinha: {
        metaTitle: 'Rocinha Favela Tour — 3 hours with an Italian guide | Vidapiena',
        metaDescription:
          '3-hour walking tour of Rocinha, Brazil’s largest favela, with Francesco, Italian guide in Rio: mototaxi to the top, panoramic views, a graffiti artist’s gallery and an Italian NGO. R$270 per person. Tours in English, Italian and Portuguese.',
        kicker: 'Favela tour · 3 hours',
        longDesc: [
          'Rocinha is Brazil’s largest favela: a city within the city, leaning on the mountain above São Conrado. The tour opens riding local mototaxis to the very top — from there we walk down, into the real life of the community.',
          'On the way down we step into a local family’s home, visit the gallery of a graffiti artist born and raised here, and pass the pitch rebuilt by a footballer from Rocinha. We close with an Italian NGO that has worked in the community for over 20 years.',
          'I tell it all in English, Italian or Portuguese, depending on the group. Small groups, human pace, nothing staged.',
        ],
        highlights: [
          'The mototaxi ride to the very top of the favela',
          'The panoramic view of Christ, the Lagoa, Sugarloaf and the beaches',
          'A local family’s home',
          'The gallery of a graffiti artist born in Rocinha',
          'The pitch rebuilt by a footballer from Rocinha',
          'The Italian NGO working here for over 20 years',
        ],
        includes: [
          'Mototaxi to the top',
          'Community visitation fee',
          'Guide in English, Italian or Portuguese',
        ],
        meetingNote: 'Av. Niemeyer 780, São Conrado (Igreja Universal). The tour starts and ends at the same spot.',
      },
      vidigal: {
        metaTitle: 'Vidigal Favela Tour — 2.5 hours with an Italian guide | Vidapiena',
        metaDescription:
          '2.5-hour walking tour of Vidigal with Francesco, Italian guide in Rio: mototaxi to the top, views over Leblon and Ipanema, the alleys, and a terrace bar facing Christ the Redeemer. R$270 per person. Tours in English, Italian and Portuguese.',
        kicker: 'Favela tour · 2.5 hours',
        longDesc: [
          'Vidigal is the favela over the sea, between Leblon and the Dois Irmãos peaks. We ride mototaxis to the upper part — revitalized, with its pitch and park — then walk down, alley by alley.',
          'On the way we stop at a bar with one of the most beautiful views in the city: Leblon, Ipanema and Sugarloaf in a single frame. The grand finale is a panoramic terrace facing Christ the Redeemer.',
        ],
        highlights: [
          'The mototaxi ride up to upper Vidigal',
          'The pitch and park of the revitalized upper part',
          'The bar overlooking Leblon, Ipanema and Sugarloaf',
          'The walk down through the community’s alleys',
          'The final terrace facing Christ the Redeemer',
        ],
        includes: [
          'Mototaxi to the top',
          'Community visitation fee',
          'Guide in English, Italian or Portuguese',
        ],
        meetingNote: 'Praça do Vidigal, at the entrance to the community.',
      },
      tavares: {
        metaTitle: 'Tavares Bastos Favela Tour — 2.5 hours with an Italian guide | Vidapiena',
        metaDescription:
          '2.5-hour walking tour of Tavares Bastos, downtown Rio’s most laid-back community, with Francesco, Italian guide: alleys, everyday life and a game on the iconic FIFA Street pitch. R$270 per person. Tours in English, Italian and Portuguese.',
        kicker: 'Favela tour · 2.5 hours',
        longDesc: [
          'Tavares Bastos is downtown Rio’s most laid-back community, perched above the Catete neighborhood. We ride mototaxis up and walk down, through alleys, small shops and everyday stories.',
          'The most famous moment is the FIFA Street pitch — yes, that one: a game there is mandatory. All around it, the real life of the community and views you don’t expect this close to downtown.',
        ],
        highlights: [
          'The mototaxi ride up and the walk down through the alleys',
          'The community’s everyday life and local commerce',
          'A game on the iconic FIFA Street pitch',
          'The views over downtown and the bay',
        ],
        includes: [
          'Mototaxi to the top',
          'Community visitation fee',
          'Guide in English, Italian or Portuguese',
        ],
        meetingNote: 'Rua Bento Lisboa 72, Catete.',
      },
      giorno: {
        metaTitle: 'Un Giorno a Rio — full-day city tour with an Italian guide | Vidapiena',
        metaDescription:
          'A full day across Christ the Redeemer, Santa Teresa, the Selarón Steps and Sugarloaf with Francesco, Italian guide: private car or van with driver, hotel pick-up, Corcovado cog train, cable car and buffet lunch. From R$780 per person.',
        kicker: 'City tour · full day',
        longDesc: [
          'The best of Rio in a single day, with nothing to organize: I pick you up at your hotel with a private car or van with driver, and off we go — Christ the Redeemer by the Corcovado cog train, the bohemian streets of Santa Teresa, the Selarón Steps, and Sugarloaf by cable car.',
          'It’s Vidapiena’s premium tour: 8 hours (9 with the buffet lunch), everything arranged and everything included — transport, tickets and the storytelling. The per-person price drops as the group grows.',
        ],
        highlights: [
          'Christ the Redeemer by the Corcovado cog train',
          'Santa Teresa and the Selarón Steps',
          'Sugarloaf by cable car',
          'Private car or van with driver and hotel pick-up',
          'Buffet lunch included (drinks excluded)',
        ],
        includes: [
          'Private car or van with driver',
          'Hotel pick-up and drop-off',
          'Corcovado cog train and Sugarloaf cable car',
          'Buffet lunch (drinks excluded)',
          'Guide in English, Italian or Portuguese',
        ],
        meetingNote: 'Pick-up straight from your hotel, anywhere in Rio. Please be ready about 30 minutes early.',
      },
    },
  },

  about: {
    metaTitle: 'The guide — Francesco, Italian in Rio de Janeiro | Vidapiena',
    metaDescription:
      'Francesco is an Italian tour guide who has lived in Rio de Janeiro for 9 years: favela tours in Rocinha, Vidigal and Tavares Bastos and the full-day "Un Giorno a Rio" city tour, in English, Italian and Portuguese.',
    kicker: 'The guide',
    heading: 'Francesco. Italian, carioca by adoption.',
    story: [
      'I’m Francesco, Italian, and I’ve lived in Rio de Janeiro for 9 years. Vidapiena — "full life" — is the name I gave to my way of being here: inside the city, not in front of it.',
      'I take people into the communities of Rocinha, Vidigal and Tavares Bastos, and around the city with "Un Giorno a Rio". Walking tours, small groups, mototaxi included: you ride up and walk down, stopping where life happens.',
      'I guide in Italian — my language — and in English and Portuguese when the group is mixed. The stories I tell come from people I know: families, artists, people born in the community.',
      'You’ll also find me on Airbnb, Viator, GetYourGuide and Civitatis — or on Instagram, where I tell Rio every day.',
    ],
    ctaTours: 'See the tours',
    ctaContact: 'Contact',
  },

  contact: {
    metaTitle: 'Contact — Francesco, Italian guide in Rio | Vidapiena',
    metaDescription:
      'Get in touch with Francesco of Vidapiena: DM him on Instagram for dates and availability, or book the tours on Airbnb, Viator, GetYourGuide and Civitatis.',
    kicker: 'Contact',
    heading: 'Let’s talk on Instagram.',
    instagramLead:
      'The most direct way to reach me is a DM on Instagram: I reply in English, Italian or Portuguese.',
    instagramCta: 'Message me on Instagram',
    bookingHeading: 'Bookings',
    bookingLead: 'The tours are booked online on the platforms:',
    logisticsHeading: 'Good to know',
    logisticsItems: [
      'Departing daily · minimum 2 people ("Un Giorno a Rio": tiered pricing by group size).',
      'Every favela tour starts from the meeting point at the foot of the community; "Un Giorno a Rio" includes hotel pick-up.',
      'Mototaxi and the community visitation fee are included in the favela tours.',
    ],
  },

  blog: {
    metaTitle: 'Blog — stories from Rio de Janeiro | Vidapiena',
    metaDescription:
      'Stories, tips and everyday life from Rio de Janeiro told by Francesco, Italian tour guide: the communities, the neighborhoods and carioca culture.',
    kicker: 'Blog',
    heading: 'Stories from Rio.',
    empty: 'First stories coming soon.',
    emptySub:
      'I’m writing the first articles: stories from the communities, practical tips and carioca life. In the meantime, find me on Instagram.',
    readMore: 'Read',
    backToBlog: '← All articles',
  },

  instagram: {
    kicker: '@vidapiena',
    heading: 'Rio, every day, on Instagram.',
    sub: 'Stories from the communities, behind the scenes of the tours, and everyday carioca life.',
    cta: 'Follow me on', // brand word rendered as the Instagram glyph in InstagramBand's CTA
  },

  finalCta: {
    heading: 'Ready to see the real Rio?',
    sub: 'Four tours, daily departures, guided in English, Italian or Portuguese. Pick yours — see you in Rio.',
    ctaTours: 'See the tours',
    instagramLabel: 'Follow me on Instagram',
  },

  badges: {
    heading: 'Book Vidapiena also on',
  },

  /* The descent route — the side rail's waypoints (304 m → 0 m). */
  route: {
    seaLevel: 'sea level',
  },

  footer: {
    line: 'Vidapiena — Francesco, Italian tour guide in Rio de Janeiro.',
    langNames: { it: 'Italiano', en: 'English' },
  },
};
