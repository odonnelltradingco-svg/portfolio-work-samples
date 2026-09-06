import { cleanMoney } from './demo-model';

export type CareLanguage = 'en' | 'fr';

const en = {
  skip: 'Skip to the estimate',
  demo: 'Original portfolio demo',
  brand: 'Fictional cleaning brand',
  source: 'View source ↗',
  examples: 'All examples ↗',
  portfolioNav: 'Portfolio navigation',
  language: 'Choose your language',
  home: 'Sunday Home — home',
  ourClean: 'Our clean',
  goodToKnow: 'Good to know',
  findClean: 'Find your clean',
  heroEyebrow: 'A LITTLE MORE ROOM TO LIVE',
  heroFirst: 'A clean home.',
  heroSecond: 'A lighter Sunday.',
  heroTextFirst: 'Less time catching up on the house.',
  heroTextSecond: 'More time for the life happening in it.',
  buildClean: 'Build your clean',
  perks: ['Your rhythm', 'Clear pricing', 'Thoughtful details'],
  photoAlt:
    'A sunlit living room with white upholstery, oak furniture and leafy greenery',
  photoFirst: 'A fresh start.',
  photoSecond: 'A little more breathing room.',
  servicesEyebrow: 'THE EVERYDAY, TAKEN CARE OF',
  servicesFirst: 'Thoughtful details.',
  servicesSecond: 'A comfortable home.',
  servicesIntro:
    'From the first cup of coffee to the last light out. A considered clean for the spaces you live in most.',
  details: 'THE DETAILS',
  rooms: [
    {
      number: '01',
      title: 'Kitchen reset',
      description: 'A fresh canvas for the next meal.',
      tasks: [
        'Counters & sink',
        'Appliance exteriors',
        'Floors & finishing touches',
      ],
    },
    {
      number: '02',
      title: 'Bathroom refresh',
      description: 'The little rituals, made lovelier.',
      tasks: [
        'Fixtures & surfaces',
        'Mirrors & glass',
        'A thorough floor clean',
      ],
    },
    {
      number: '03',
      title: 'Living, made lighter',
      description: 'Room to settle in and switch off.',
      tasks: [
        'Accessible surface dusting',
        'Vacuuming & mopping',
        'Bedrooms & shared spaces',
      ],
    },
  ],
  estimateEyebrow: 'A CLEAN THAT FITS',
  estimateFirst: 'Your home.',
  estimateSecond: 'Your rhythm.',
  estimateIntro:
    'A little reset or a regular ritual. Choose what fits, see the price, then take a closer look.',
  steps: [
    [
      'Tell us about your space',
      'Bedrooms and bathrooms set the starting price.',
    ],
    ['Find your rhythm', 'Compare one-time and regular visits.'],
    ['Make it yours', 'Add the details, then preview your clean.'],
  ],
  demoNote:
    'An interactive portfolio demo. Sample prices in USD. No booking, personal details or payment required.',
  cardEyebrow: 'LET’S MAKE ROOM',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  howOften: 'How often?',
  rhythms: [
    {
      value: 'once',
      label: 'Just once',
      short: 'One visit',
      saving: 'A fresh start',
    },
    {
      value: 'fortnightly',
      label: 'Every 2 weeks',
      short: 'Every two weeks',
      saving: 'Save 10%',
    },
    {
      value: 'weekly',
      label: 'Every week',
      short: 'Weekly',
      saving: 'Save 15%',
    },
  ],
  visit: '/ visit',
  addDeep: 'Add a deeper clean',
  extraAttention: 'A little extra attention',
  deepDetail: 'Baseboards and detailed surfaces.',
  deepPrice: '+$65 per visit, before any recurring saving.',
  standard: 'Standard clean',
  deeper: 'Deeper clean',
  regularSaving: 'Regular-visit saving',
  recurringSaving: 'Recurring saving',
  sampleEstimate: 'Your sample estimate',
  usdVisit: 'USD per visit',
  withDeep: 'With a deeper clean.',
  perVisit: 'per visit.',
  preview: 'Preview this clean',
  previewMark: 'SUNDAY HOME / YOUR PREVIEW',
  previewFirst: 'A little more room',
  previewSecond: 'for you.',
  previewDescription:
    'Here’s your sample clean, with every detail in one place. Nothing has been booked.',
  includes: 'Your clean includes',
  includedTasks: [
    'Kitchen surfaces, sink & appliance exteriors',
    'Bathroom fixtures, mirrors & floors',
    'Dusting, vacuuming & mopping',
  ],
  includedDeep: 'Extra attention to baseboards & detailed surfaces',
  sampleTotal: 'Sample total',
  back: 'Back to your choices',
  close: 'Close',
  previewNote: 'Fictional brand · Sample pricing · No payment collected',
  cardNote: 'A preview, with no commitment.',
  faqEyebrow: 'GOOD TO KNOW',
  faqTitle: 'A few simple answers.',
  faqIntro: 'Clear details, from the start.',
  questions: [
    [
      'included',
      'What is included in a standard clean?',
      'The sample service covers kitchen counters, sink and appliance exteriors; bathroom fixtures and mirrors; accessible surface dusting, vacuuming and mopping. Oven interiors, exterior windows, laundry and specialist cleaning are outside this sample scope.',
    ],
    [
      'deep',
      'What does a deeper clean add?',
      'The optional $65 add-on covers extra attention to baseboards and detailed surfaces. When selected, it is included in each previewed visit. The recurring discount also applies to this add-on.',
    ],
    [
      'price',
      'How is my estimate calculated?',
      'Sample pricing is $70 per visit, plus $25 per bedroom and $20 per bathroom. A deeper clean adds $65. Every-two-week visits save 10% and weekly visits save 15% on the combined amount. Prices are shown in US dollars, calculated to the cent.',
    ],
    [
      'real',
      'Can I make a real booking here?',
      'Sunday Home is an original portfolio demonstration with a fictional brand and sample prices. The preview stays in your browser; it does not send personal information, reserve a visit or collect payment.',
    ],
  ],
  credit: "Original website demonstration by Pierce O'Donnell",
  contact: 'Discuss your website on Upwork ↗',
};

const fr: typeof en = {
  skip: 'Aller à l’estimation',
  demo: 'Démonstration originale',
  brand: 'Marque de ménage fictive',
  source: 'Voir le code ↗',
  examples: 'Tous les exemples ↗',
  portfolioNav: 'Navigation du portfolio',
  language: 'Choisir la langue',
  home: 'Sunday Home — accueil',
  ourClean: 'Nos services',
  goodToKnow: 'À savoir',
  findClean: 'Votre estimation',
  heroEyebrow: 'PLUS DE PLACE POUR PROFITER',
  heroFirst: 'Une maison propre.',
  heroSecond: 'Un dimanche plus léger.',
  heroTextFirst: 'Moins de temps à entretenir la maison.',
  heroTextSecond: 'Plus de temps pour y vivre pleinement.',
  buildClean: 'Composez votre ménage',
  perks: ['Votre rythme', 'Des prix clairs', 'Le soin du détail'],
  photoAlt:
    'Un salon ensoleillé avec un canapé blanc, des meubles en chêne et des plantes vertes',
  photoFirst: 'Un nouveau départ.',
  photoSecond: 'Un peu plus d’espace pour souffler.',
  servicesEyebrow: 'LE QUOTIDIEN, EN TOUTE SIMPLICITÉ',
  servicesFirst: 'Le soin du détail.',
  servicesSecond: 'Le confort chez vous.',
  servicesIntro:
    'Du premier café aux dernières lumières. Un ménage soigné dans les pièces où se déroule votre quotidien.',
  details: 'EN DÉTAIL',
  rooms: [
    {
      number: '01',
      title: 'Une cuisine accueillante',
      description: 'Une base propre pour le prochain repas.',
      tasks: [
        'Plans de travail et évier',
        'Extérieur des appareils',
        'Sols et finitions',
      ],
    },
    {
      number: '02',
      title: 'Une salle de bains fraîche',
      description: 'Des petits rituels plus agréables.',
      tasks: [
        'Équipements et surfaces',
        'Miroirs et surfaces vitrées',
        'Nettoyage soigné du sol',
      ],
    },
    {
      number: '03',
      title: 'Des pièces où se détendre',
      description: 'De la place pour se poser et déconnecter.',
      tasks: [
        'Dépoussiérage des surfaces accessibles',
        'Aspiration et lavage des sols',
        'Chambres et espaces communs',
      ],
    },
  ],
  estimateEyebrow: 'UN MÉNAGE QUI VOUS RESSEMBLE',
  estimateFirst: 'Votre maison.',
  estimateSecond: 'Votre rythme.',
  estimateIntro:
    'Un coup de frais ponctuel ou un rendez-vous régulier. Faites vos choix, découvrez le prix et consultez les détails.',
  steps: [
    [
      'Décrivez votre espace',
      'Le nombre de chambres et de salles de bains détermine le prix de départ.',
    ],
    [
      'Choisissez votre rythme',
      'Comparez une intervention ponctuelle et des visites régulières.',
    ],
    [
      'Ajoutez votre touche',
      'Choisissez les options, puis consultez le récapitulatif.',
    ],
  ],
  demoNote:
    'Démonstration interactive de portfolio. Prix indicatifs en dollars américains (USD). Aucune réservation, donnée personnelle ou somme demandée.',
  cardEyebrow: 'FAISONS UN PEU DE PLACE',
  bedrooms: 'Chambres',
  bathrooms: 'Salles de bains',
  howOften: 'À quelle fréquence ?',
  rhythms: [
    {
      value: 'once',
      label: 'Une seule fois',
      short: 'Une intervention',
      saving: 'Un nouveau départ',
    },
    {
      value: 'fortnightly',
      label: 'Toutes les 2 semaines',
      short: 'Toutes les deux semaines',
      saving: 'Économisez 10 %',
    },
    {
      value: 'weekly',
      label: 'Chaque semaine',
      short: 'Chaque semaine',
      saving: 'Économisez 15 %',
    },
  ],
  visit: '/ visite',
  addDeep: 'Ajouter un ménage approfondi',
  extraAttention: 'Un peu plus d’attention',
  deepDetail: 'Plinthes et surfaces nettoyées en détail.',
  deepPrice: '+65 $ par visite, avant la remise de fidélité.',
  standard: 'Ménage standard',
  deeper: 'Ménage approfondi',
  regularSaving: 'Remise pour visites régulières',
  recurringSaving: 'Remise de fidélité',
  sampleEstimate: 'Votre estimation indicative',
  usdVisit: 'USD par visite',
  withDeep: 'Avec ménage approfondi.',
  perVisit: 'par visite.',
  preview: 'Voir le récapitulatif',
  previewMark: 'SUNDAY HOME / VOTRE RÉCAPITULATIF',
  previewFirst: 'Un peu plus de place',
  previewSecond: 'pour vous.',
  previewDescription:
    'Retrouvez ici votre ménage indicatif et tous ses détails. Aucune réservation n’a été effectuée.',
  includes: 'Votre ménage comprend',
  includedTasks: [
    'Surfaces de cuisine, évier et extérieur des appareils',
    'Équipements de salle de bains, miroirs et sols',
    'Dépoussiérage, aspiration et lavage des sols',
  ],
  includedDeep: 'Nettoyage détaillé des plinthes et des surfaces',
  sampleTotal: 'Total indicatif',
  back: 'Modifier mes choix',
  close: 'Fermer',
  previewNote: 'Marque fictive · Prix indicatifs · Aucun paiement encaissé',
  cardNote: 'Un aperçu sans engagement.',
  faqEyebrow: 'À SAVOIR',
  faqTitle: 'Quelques réponses simples.',
  faqIntro: 'Des détails clairs, dès le départ.',
  questions: [
    [
      'included',
      'Que comprend le ménage standard ?',
      'Cette prestation fictive comprend les plans de travail, l’évier et l’extérieur des appareils de cuisine ; les équipements et les miroirs de salle de bains ; le dépoussiérage des surfaces accessibles, l’aspiration et le lavage des sols. L’intérieur du four, les vitres extérieures, le linge et les nettoyages spécialisés ne sont pas inclus.',
    ],
    [
      'deep',
      'Que comprend le ménage approfondi ?',
      'L’option à 65 $ ajoute un nettoyage détaillé des plinthes et des surfaces. Lorsqu’elle est sélectionnée, elle s’applique à chaque visite du récapitulatif. La remise pour visites régulières s’applique également à cette option.',
    ],
    [
      'price',
      'Comment l’estimation est-elle calculée ?',
      'Les prix indicatifs sont de 70 $ par visite, plus 25 $ par chambre et 20 $ par salle de bains. Le ménage approfondi ajoute 65 $. Une visite toutes les deux semaines donne droit à une remise de 10 %, et une visite hebdomadaire à 15 %, sur le montant total. Tous les prix sont en dollars américains (USD), calculés au centime.',
    ],
    [
      'real',
      'Puis-je réserver une vraie intervention ici ?',
      'Sunday Home est une démonstration originale de portfolio avec une marque fictive et des prix indicatifs. Le récapitulatif reste dans votre navigateur : aucune donnée personnelle n’est envoyée, aucune visite n’est réservée et aucun paiement n’est encaissé.',
    ],
  ],
  credit: "Démonstration originale de site par Pierce O'Donnell",
  contact: 'Parlons de votre site sur Upwork ↗',
};

export const careCopy = { en, fr };

export function careMoney(value: number, language: CareLanguage) {
  if (language === 'en') return cleanMoney(value);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function careRoomCount(
  count: number,
  kind: 'beds' | 'baths',
  language: CareLanguage,
) {
  const word =
    language === 'fr'
      ? kind === 'beds'
        ? count === 1
          ? 'chambre'
          : 'chambres'
        : count === 1
          ? 'salle de bains'
          : 'salles de bains'
      : (kind === 'beds' ? 'bedroom' : 'bathroom') + (count === 1 ? '' : 's');
  return `${count} ${word}`;
}
