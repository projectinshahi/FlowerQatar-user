import { PressMention } from '../types';

export const PRESS_MENTIONS: PressMention[] = [
  {
    publication: 'Vogue',
    logo: 'VOGUE',
    quote: '"The floral arrangements beloved by celebrities and designers alike—a stunning addition that lasts a full year."',
    date: 'Jan 2026'
  },
  {
    publication: 'Forbes',
    logo: 'FORBES',
    quote: '"Venus et Fleur has disrupted the floral industry, creating a premium market for eternity roses."',
    date: 'Feb 2026'
  },
  {
    publication: 'Harper\'s Bazaar',
    logo: 'BAZAAR',
    quote: '"The gold standard of luxury floral gifts. The preservation quality is second to none."',
    date: 'Mar 2026'
  },
  {
    publication: 'Architectural Digest',
    logo: 'AD',
    quote: '"Beyond flowers: these arrangements are actual home decor centerpieces that command attention."',
    date: 'Apr 2026'
  }
];

export interface CelebrityQuote {
  name: string;
  quote: string;
  image: string;
}

export const CELEBRITIES: CelebrityQuote[] = [
  {
    name: 'Gigi Hadid',
    quote: 'Absolutely obsessed with the blush pink round boxes in my apartment.',
    image: '/images/product_master_1_1782290164345.png'
  },
  {
    name: 'Cardi B',
    quote: 'My dressing room is filled with these custom red rose hearts!',
    image: '/images/product_master_1_1782290164345.png'
  },
  {
    name: 'Kim Kardashian',
    quote: 'The only roses I keep in my home. The black roses match my aesthetic perfectly.',
    image: '/images/product_master_1_1782290164345.png'
  }
];
