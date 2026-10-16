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
      'Walking tours of Rio’s favelas — Rocinha, Vidigal, Tavares Bastos — and the full-day "Un Giorno a Rio" city tour with Francesco, Italian guide in Rio de Janeiro for 9 years. Tours in English, Italian and Portuguese. Small groups, mototaxi included, from €58 per person.',
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
    book: 'Book',
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
    sub: 'I’m Francesco — Italian, 9 years in Rio. I take you on foot through the real life of the community: small groups, mototaxi included, in English, Italian or Portuguese, from €58 per person.',
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
    photoAlt: 'Francesco, Italian tour guide in Rio de Janeiro, in front of Christ the Redeemer',
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
        /* No child price on Rocinha (removed 01/09/2026) → empty note. */
        note: '',
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
        note: 'Full day · everything included',
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
    galleryPrev: 'Previous photo',
    galleryNext: 'Next photo',
    /** Live-region + progress-dot label. %c = current, %t = total. */
    galleryPosition: 'Photo %c of %t',
    galleryHint: 'Drag or use the arrows',
    practicalHeading: 'Practical info',
    includesHeading: 'Included in the price',
    priceHeading: 'Prices',
    tierLabel: (min: number, max: number) => `${min}–${max} people`,
    bookingHeading: 'Book this tour',
    instagramDm: 'Message me on Instagram',
    otherToursHeading: 'The other tours',
    fromBlog: 'From the blog',
    faqHeading: 'Frequently asked questions',
    /* Q&A shared by every tour — written to be quoted verbatim by Google and by
       AI assistants. The tour-specific questions, with real numbers, live in
       items[id].faq. */
    faqCommon: [
      {
        q: 'Is it safe to visit a favela?',
        a: 'Yes, with a guide who knows the community. I have walked these streets for 9 years and I know the people: we only go where we are welcome. I always tell you where we are and how to behave, and never photograph people without asking. Small groups, easy pace.',
      },
      {
        q: 'Is the tour ethical?',
        a: 'It is not a human zoo. We enter with respect and part of what you pay stays in the community: the local guys’ mototaxis, the community fee, the families and artists we meet. I tell the real life, without turning poverty into a show.',
      },
      {
        q: 'Can I take photos?',
        a: 'Yes, but not of people without asking first. Views and painted walls, always; people and homes only with their permission. I will point it out as we go.',
      },
      {
        q: 'Is it suitable for kids and families?',
        a: 'The favela tours aren’t suitable for children. For families there’s Un Giorno a Rio, the full day in the city with hotel pick-up.',
      },
      {
        q: 'What should I bring and wear?',
        a: 'Comfortable closed shoes (we walk downhill on uneven streets and stairs), water and a little cash for a coffee or local crafts. Comfortable clothes, nothing flashy; a hat and sunscreen on sunny days.',
      },
      {
        q: 'How do I book?',
        a: 'You book with me: message me on WhatsApp or DM me on Instagram (@vidapiena) and we sort out the date and availability together, tailored to you. You’ll also find me on Viator, GetYourGuide, Airbnb and Civitatis.',
      },
      {
        q: 'What if it rains or I need to cancel?',
        a: 'If you cancel more than 48 hours before, you get a full refund; within 48 hours, 75%; a no-show is not refunded. If I have to cancel (bad weather, safety, or I can’t make it), you choose: a new date or a full refund. For changes just message me on WhatsApp or Instagram; the minimum is 2 people.',
      },
    ],
    items: {
      rocinha: {
        metaTitle: 'Rocinha Favela Tour — 3 hours with an Italian guide | Vidapiena',
        metaDescription:
          '3-hour walking tour of Rocinha, Brazil’s largest favela, with Francesco, Italian guide in Rio: mototaxi to the top, panoramic views, a graffiti artist’s gallery and an Italian NGO. €58 per person. Tours in English, Italian and Portuguese.',
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
        meetingNote: 'São Conrado, at the foot of Rocinha. The exact address comes with your booking confirmation. The tour starts and ends at the same spot.',
        faq: [
          {
            q: 'Where and when do we meet?',
            a: 'We meet in São Conrado, at the foot of Rocinha: the exact address comes with your booking confirmation, after payment. The tour starts and ends at the same spot and lasts about 3 hours. Daily departures, minimum 2 people.',
          },
          {
            q: 'What is included in the price?',
            a: '€58 per person. It includes the mototaxi to the top, the community visitation fee and the guide in English, Italian or Portuguese.',
          },
          {
            q: 'How much walking is there?',
            a: 'We ride mototaxis to the top and walk down: about 3 hours downhill on uneven streets and stairs. Comfortable closed shoes recommended.',
          },
        ],
      },
      vidigal: {
        metaTitle: 'Vidigal Favela Tour — 2.5 hours with an Italian guide | Vidapiena',
        metaDescription:
          '2.5-hour walking tour of Vidigal with Francesco, Italian guide in Rio: mototaxi to the top, views over Leblon and Ipanema, the alleys, and a terrace bar facing Christ the Redeemer. €58 per person. Tours in English, Italian and Portuguese.',
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
        meetingNote: 'Vidigal, at the entrance to the community. The exact address comes with your booking confirmation.',
        faq: [
          {
            q: 'Where and when do we meet?',
            a: 'We meet in Vidigal, at the entrance to the community: the exact address comes with your booking confirmation, after payment. The tour lasts about 2.5 hours. Daily departures, minimum 2 people.',
          },
          {
            q: 'What is included in the price?',
            a: '€58 per person. It includes the mototaxi up to upper Vidigal, the community visitation fee and the guide in English, Italian or Portuguese.',
          },
          {
            q: 'What is the best view?',
            a: 'We stop at a bar with Leblon, Ipanema and Sugarloaf in a single frame, and finish on a panoramic terrace facing Christ the Redeemer. It is the sunset tour par excellence.',
          },
        ],
      },
      tavares: {
        metaTitle: 'Tavares Bastos Favela Tour — 2.5 hours with an Italian guide | Vidapiena',
        metaDescription:
          '2.5-hour walking tour of Tavares Bastos, downtown Rio’s most laid-back community, with Francesco, Italian guide: alleys, everyday life and a game on the iconic FIFA Street pitch. €58 per person. Tours in English, Italian and Portuguese.',
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
        meetingNote: 'Catete, at the foot of Tavares Bastos. The exact address comes with your booking confirmation.',
        faq: [
          {
            q: 'Where and when do we meet?',
            a: 'We meet in Catete, at the foot of Tavares Bastos: the exact address comes with your booking confirmation, after payment. The tour lasts about 2.5 hours. Daily departures, minimum 2 people.',
          },
          {
            q: 'What is included in the price?',
            a: '€58 per person. It includes the mototaxi and the guide in English, Italian or Portuguese. Tavares Bastos is downtown Rio’s most laid-back community.',
          },
          {
            q: 'Do we really play on the FIFA Street pitch?',
            a: 'Yes: the iconic FIFA Street pitch is here and a game is almost mandatory. Around it, the community’s everyday life and views over downtown and the bay.',
          },
        ],
      },
      giorno: {
        metaTitle: 'Un Giorno a Rio — full-day city tour with an Italian guide | Vidapiena',
        metaDescription:
          'A full day across Christ the Redeemer, Santa Teresa, the Selarón Steps and Sugarloaf with Francesco, Italian guide: private car or van with driver, hotel pick-up, Corcovado cog train, cable car and buffet lunch. €229 per person, with a lower rate for larger groups.',
        kicker: 'City tour · full day',
        longDesc: [
          'The best of Rio in a single day, with nothing to organize: I pick you up at your hotel with a private car or van with driver, and off we go — Christ the Redeemer by the Corcovado cog train, the bohemian streets of Santa Teresa, the Selarón Steps, and Sugarloaf by cable car.',
          'It’s Vidapiena’s premium tour: 8 hours (9 with the buffet lunch), everything arranged and everything included — transport, tickets and the storytelling. The per-person price falls as the group grows: from €229 for 2-3 people down to €149 from 7, always everything included.',
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
        meetingNote: 'Pick-up straight from your hotel in Copacabana, Ipanema, Leblon, Botafogo, Flamengo or Centro. Please be ready about 30 minutes early.',
        faq: [
          {
            q: 'Where and when do we meet?',
            a: 'I pick you up straight from your hotel in Copacabana, Ipanema, Leblon, Botafogo, Flamengo or Centro (no pick-up in Barra or Recreio). The day lasts about 8 hours (9 with lunch); please be ready about 30 minutes early. Daily departures, minimum 2 people.',
          },
          {
            q: 'How much does it cost and how does pricing work?',
            a: 'The price is per person and falls as the group grows: €229 for 2-3 people, €171 for 4 to 6, €149 for 7 to 15. It includes a private car or van with driver, tickets, the Corcovado cog train, the Sugarloaf cable car and a buffet lunch (drinks excluded).',
          },
          {
            q: 'What do we see in one day?',
            a: 'Christ the Redeemer by the Corcovado cog train, the Santa Teresa neighborhood, the Selarón Steps and Sugarloaf by cable car. Everything arranged, with hotel pick-up and drop-off.',
          },
        ],
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
    ],
    /* "You’ll also find me on …" — rendered with real platform links in
       AboutPage.astro (names not yet linked stay plain text). */
    platforms: {
      lead: 'You’ll also find me on',
      and: 'and',
      instagramLead: 'or on',
      tail: ', where I tell Rio every day.',
    },
    /* Only in the "The guide" section, never on the home page: specific details.
       "Personal-accident" (participant cover), NOT civil-liability insurance. */
    trust: {
      heading: 'Good to know',
      items: [
        'Participants are covered by a personal-accident insurance policy (Porto Seguro).',
        'A registered Brazilian business (MEI, an individual micro-enterprise, with CNPJ).',
      ],
    },
    ctaTours: 'See the tours',
    ctaContact: 'Contact',
  },

  contact: {
    metaTitle: 'Contact — Francesco, Italian guide in Rio | Vidapiena',
    metaDescription:
      'Get in touch with Francesco of Vidapiena: book the tours with him on WhatsApp or by DM on Instagram, for a personalised, made-to-measure service. You’ll also find him on Viator, GetYourGuide, Airbnb and Civitatis.',
    kicker: 'Contact',
    heading: 'Book directly with me.',
    instagramLead:
      'The most direct way to book or ask me anything is a message on WhatsApp or a DM on Instagram: I reply in English, Italian or Portuguese.',
    instagramCta: 'Message me on Instagram',
    bookingHeading: 'Bookings',
    bookingLead:
      'Book with me: message me on WhatsApp or DM me on Instagram and we’ll sort out the date and availability, tailored to you. You’ll also find me on the platforms below.',
    logisticsHeading: 'Good to know',
    logisticsItems: [
      'Departing daily · minimum 2 people.',
      'Every favela tour starts from the meeting point at the foot of the community; "Un Giorno a Rio" includes hotel pick-up.',
      'Mototaxi and the community visitation fee are included in the favela tours.',
    ],
  },

  bookPage: {
    metaTitle: 'Book a tour in Rio — live availability | Vidapiena',
    metaDescription:
      'Pick the tour and the day: the Vidapiena calendar shows free dates in real time. Pay securely online with PayPal or card and your place is confirmed straight away.',
    kicker: 'Book',
    heading: 'Pick the tour, pick the day.',
    pickerLabel: 'Choose a tour',
    detailLink: 'See the tour',
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
    updatedOn: 'Updated on',
    related: 'Keep reading',
    relatedTour: 'The tour behind this story',
    relatedTours: 'The tours behind this story',
  },

  instagram: {
    kicker: '@vidapiena',
    heading: 'Rio, every day, on Instagram.',
    sub: 'Stories from the communities, behind the scenes of the tours, and everyday carioca life.',
    cta: 'Follow me on', // brand word rendered as the Instagram glyph in InstagramBand's CTA
    /* Band's second CTA: same shape, TikTok glyph in place of the brand word. */
    tiktokCta: 'Watch me on',
  },

  /* External coverage — who talks about Vidapiena off this site. The facts (URL,
     outlet, aggregates) live in src/data/mentions.ts; this is only the localized
     chrome, one `items` entry per MENTIONS key. Entries with a `rating` in the
     data render as stat cards and use statLabel; the others use quote. `outlet`
     is never translated — it lives in the data. */
  press: {
    eyebrow: 'Featured in',
    heading: 'Not just my own words.',
    sub: 'Magazines, guides and travel assistants that cover Vidapiena — outside sources, one click away.',
    prev: 'Previous mention',
    next: 'Next mention',
    items: {
      voglioVivereCosi: {
        kind: 'Interview',
        meta: 'April 2026',
        quote: 'In Brazil, there’s a love for life.',
        lead: 'Voglio Vivere Così — the Italian magazine for people dreaming of changing their life and moving abroad — told my story: why I left Milan for Rio, and how I live in Vidigal today.',
        cta: 'Read the interview →',
      },
      wanderboat: {
        kind: 'AI travel guide',
        meta: 'local listing · Vidigal',
        statLabel: (n: number) => `${n} reviews`,
        lead: 'Wanderboat, the AI travel assistant that suggests what to do in a city, lists Vidapiena among the things to do in Vidigal: contacts, hours and reviews from people who have already come.',
        cta: 'Open the listing →',
      },
    },
  },

  finalCta: {
    heading: 'Ready to see the real Rio?',
    sub: 'Four tours, daily departures, guided in English, Italian or Portuguese. Pick yours — see you in Rio.',
    ctaTours: 'See the tours',
    instagramLabel: 'Follow me on Instagram',
    tiktokLabel: 'Follow me on TikTok',
  },

  /* Real Google reviews as social proof (curated static layer). The review text
     lives in src/data/reviews.ts — locale-independent: real customers' words, not
     translated. Only the chrome is localized. Shape must match it.ts. */
  testimonials: {
    eyebrow: 'Reviews',
    heading: 'What travelers say.',
    sub: 'The words of people who have already walked Rio’s communities with me.',
    rated: (n: number) => `5.0 out of 5 · ${n} reviews on Google`,
    source: 'via Google',
    cta: 'Read all reviews on Google →',
  },

  /* Direct booking (client decision 19 Aug 2026): WhatsApp + Instagram, no
     commission. waPrefillTour is a function — its shape must match it.ts exactly
     (the `typeof it` contract). */
  booking: {
    lead: 'Book with me, for a personalised, made-to-measure service: message me on WhatsApp or DM me on Instagram and we’ll sort out the date and availability. The platforms are here just as a showcase.',
    waCta: 'Book on WhatsApp',
    waPrefillTour: (name: string) =>
      `Hi Francesco! I'd like to book the "${name}" tour. Could you share dates and availability?`,
    waPrefillGeneric: `Hi Francesco! I'd like some info about your Rio tours.`,
    /* Bókun calendar (29 Sep 2026 — PayPal switch): the Default Channel takes
       FULL PAYMENT ONLINE through PayPal Complete Payments (PayPal or card).
       All four experiences are capacityType LIMITED, so the seat is taken the
       moment the payment goes through; nothing is due on the day. */
    calendarHeading: 'See available dates',
    calendarLead:
      'Pick a day and book it in a couple of taps. Pay securely online with PayPal or card: your place is confirmed straight away and there is nothing to pay on the day.',
    calendarNoscript: 'Enable JavaScript to see the calendar, or just message me on WhatsApp.',
    calendarEyebrow: 'Live availability',
    /* Short label: it has to fit the button row on the home page cards. */
    calendarCta: 'Free dates',
    calendarCtaLong: 'See the free dates',
    calendarExpand: 'Enlarge',
    calendarLoading: 'Loading the calendar',
    calendarClose: 'Close the calendar',
    calendarNote: 'Secure online payment with PayPal or card, charged in Brazilian reais (R$): your booking is confirmed straight away. Free cancellation up to 48 hours before.',
    /* The iframe title — what screen readers and the frame list read out. */
    calendarFrameTitle: (name: string) => `Availability calendar — ${name}`,
    calendarAria: (name: string) => `See the free dates for ${name}`,
  },

  badges: {
    heading: 'Also on',
  },

  /* The descent route — the side rail's waypoints (304 m → 0 m). */
  route: {
    seaLevel: 'sea level',
  },

  privacy: {
    metaTitle: 'Privacy policy — how I handle your data | Vidapiena',
    metaDescription:
      'Vidapiena’s privacy policy: what data I collect on the website, in bookings and in the WhatsApp chat, how long I keep it, who I share it with and how to ask for it to be deleted.',
    kicker: 'Privacy policy',
    heading: 'How I handle your data.',
    sub: 'In short: I only use your data to answer you and to organise your tour. I don’t sell it and I don’t use it for advertising. Everything is below, in plain words.',
    updatedLabel: 'Last updated',
    tocLabel: 'On this page',
    emailLabel: 'Email',
    whatsappLabel: 'WhatsApp',
    sections: [
      {
        id: 'who-i-am',
        heading: 'Who I am',
        body: [
          'The data controller is me, Francesco Motta Mendes dos Santos, a tour guide in Rio de Janeiro (Brazil) working under the Vidapiena brand. This policy covers this website, the Vidapiena WhatsApp chat and direct bookings.',
          'For any question about your data, you can reach me here:',
        ],
        contacts: true,
      },
      {
        id: 'website',
        heading: 'When you visit the website',
        body: [
          'The website sets no cookies of its own and has no analytics, advertising or tracking pixels. Even the fonts are hosted here, not on outside services.',
          'The website is hosted by Cloudflare, which processes technical data such as your IP address and browser type to run it and protect it from attacks.',
          'Pages with the calendar load the calendar of Bókun, my booking system: inside it, Bókun may use its own technical cookies, for example to remember your cart.',
          'The WhatsApp, Instagram and TikTok buttons take you off this website: from there, those services’ rules apply.',
        ],
      },
      {
        id: 'bookings',
        heading: 'When you book',
        body: [
          'For a booking I collect your first name, last name, email and phone number; for "Un Giorno a Rio" also the hotel where I pick you up. I need them to confirm the tour, send you the payment link and the meeting point, and let you know if anything changes.',
          'Bookings are managed by Bókun. Payment is online with PayPal, using a PayPal account or a card: only PayPal sees your card details, never me.',
          'If you book on a platform such as Viator, GetYourGuide or Airbnb, the platform passes me the data needed for the tour; for everything else its own privacy rules apply.',
          'I keep booking data for as long as the tour and the tax and accounting duties under Brazilian law require.',
        ],
      },
      {
        id: 'whatsapp',
        heading: 'When you message me on WhatsApp',
        body: [
          'If you open the chat from the website or from Instagram, with the ready-made message, an automated assistant answers first: it knows my tours, checks free dates and can prepare your booking. When needed, or if you ask, the chat is handed to me. If you message me any other way, I answer myself.',
          'To do this, the assistant processes:',
        ],
        items: [
          'your WhatsApp number and the messages you write;',
          'voice messages, which are transcribed to text with Cloudflare Workers AI. The audio is not saved;',
          'photos, which are sent to Claude only to answer you, for example if you send a screenshot of a booking. The photo is not saved;',
          'videos, documents and stickers are not opened: it only reads any caption and asks you to write in words.',
        ],
        after: [
          'The replies are written by Claude, Anthropic’s artificial intelligence: for each reply it receives your message and the latest messages of the chat. Anthropic works as my provider and, under its terms for businesses, does not use this data to train its models.',
          'The chat also stays in the WhatsApp Business app on my phone, like any WhatsApp conversation.',
          'The assistant sends no advertising. If you booked in the chat and message me after the tour, it asks you once, and only once, for a Google review.',
        ],
      },
      {
        id: 'memory',
        heading: 'What the assistant remembers, and for how long',
        body: [
          'The assistant saves very little, in Cloudflare’s database, linked to your number. Each item deletes itself when it expires:',
        ],
        rows: [
          {
            k: 'The conversation',
            v: 'The last 12 messages (6 exchanges): never photos, voice messages only as text. Deleted 2 hours after the last message.',
          },
          {
            k: 'A booking proposal',
            v: 'Tour, date, people, name, email and hotel if any: 1 hour, or until you confirm or cancel.',
          },
          {
            k: 'The tour booked in the chat',
            v: 'Booking code, tour, date and time: until 3 days after the tour, for the review request.',
          },
          {
            k: 'The first contact',
            v: 'That we have already talked and that the chat started from the website or Instagram, so you aren’t greeted twice: 30 days.',
          },
          {
            k: 'A chat handed to me',
            v: 'Why it was handed over, or the fact that I’m writing to you myself and the assistant must stay quiet: 24 hours.',
          },
          {
            k: 'Anti-spam counters',
            v: 'How many messages, voice messages and photos you send in a day: 2 days.',
          },
        ],
        after: [
          'The service’s technical logs are written so as not to contain the text of messages: they show only the last 4 digits of the number. Cloudflare deletes them automatically after a few days.',
        ],
      },
      {
        id: 'alerts',
        heading: 'The alerts I receive on Telegram',
        body: [
          'When the assistant hands the chat to me, or when you book in the chat, I get an alert on Telegram with your number, the reason, your last message or a short summary and, for bookings, the tour, date, name and email. That way I can answer you in person.',
          'If you email me, I get a short alert on Telegram with the sender and the subject; the text of the email stays only in my mailbox.',
          'The alerts go only to me and to the technical consultant who runs the website and the assistant on my behalf.',
        ],
      },
      {
        id: 'providers',
        heading: 'The providers I use',
        body: ['Each one processes data only for the service it gives me:'],
        items: [
          'Meta (WhatsApp): delivers the messages between you and me;',
          'Cloudflare: hosts the website and the assistant, stores its short memory, transcribes voice messages and forwards me the email alerts;',
          'Anthropic (Claude): writes the assistant’s replies and reads photos;',
          'Bókun: bookings, calendar and confirmation emails;',
          'PayPal: payments and refunds;',
          'Microsoft (Outlook): the Vidapiena mailbox;',
          'Telegram: the alerts I receive.',
        ],
        after: [
          'Some of these providers process data outside Brazil and the European Union, for example in the United States. I don’t sell your data and I don’t give it to anyone for advertising.',
        ],
      },
      {
        id: 'legal-basis',
        heading: 'Why I’m allowed to use it',
        body: [
          'I use your data to answer your questions and for the tour you book (it is needed for the contract, or to prepare it), to meet my tax obligations, and for a legitimate interest: protecting the service from spam and abuse.',
          'The assistant never takes an important decision on its own: date changes, refunds and complaints always go through me.',
        ],
      },
      {
        id: 'your-rights',
        heading: 'Your rights',
        body: [
          'Under Brazil’s data protection law (LGPD) and, if you live in the European Union, under the GDPR, you can ask me at any time to:',
        ],
        items: [
          'tell you whether I hold data about you and give you a copy;',
          'correct it if it is wrong or incomplete;',
          'delete it;',
          'restrict its use, or object to a use;',
          'give it to you in a readable format, to take it elsewhere;',
          'tell you who I have shared it with;',
          'withdraw your consent, where a use is based on consent.',
        ],
        after: [
          'If you think I have mishandled your data, you can turn to the ANPD, Brazil’s data protection authority, or to the authority of your country if you live in the European Union.',
        ],
      },
      {
        id: 'delete-your-data',
        heading: 'How to ask for deletion',
        body: [
          'Email me, or message me on WhatsApp from the number you used with me, with the words "delete my data". If you booked, add the booking code.',
          'I delete what I keep myself: the chat on my phone, the Telegram alerts and the assistant’s memory, which deletes itself anyway within the times listed above. For bookings I keep only what tax law requires me to keep, and only for that.',
          'I reply within 15 days. If you booked on Viator, GetYourGuide or Airbnb, also write to the platform for the data it holds.',
        ],
        contacts: true,
      },
      {
        id: 'changes',
        heading: 'Changes',
        body: ['If I change how I handle data, I update this page and the date at the top.'],
      },
    ],
  },

  footer: {
    line: 'Vidapiena — Francesco, Italian tour guide in Rio de Janeiro.',
    langNames: { it: 'Italiano', en: 'English' },
    privacy: 'Privacy',
  },
};
