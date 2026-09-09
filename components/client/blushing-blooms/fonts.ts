import localFont from 'next/font/local';
import {
  Galada,
  Gwendolyn,
  Marck_Script,
  MonteCarlo,
  Montez,
  Nothing_You_Could_Do,
  Poltawski_Nowy,
} from 'next/font/google';

/**
 * Type used only by the Blushing Blooms route.
 *
 * Everything here is self-hosted through next/font, so nothing is fetched from Google at
 * runtime and none of it is downloaded on another page: the variable classes are applied to
 * the Blushing Blooms page root, so the CSS variables resolve to a real family only inside it.
 */

/** Display face for the Blushing Blooms hero headline. */
export const jedira = localFont({
  src: '../../../public/jedira-regular.ttf',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-jedira',
  // The headline is a short, known string; Cormorant is metrically close enough to swap cleanly.
  fallback: ['Cormorant Garamond', 'serif'],
});

/*
 * The six faces the quick view's WISHING FONT picker offers, plus Gwendolyn for the
 * greeting-card preview heading. Keys match GREETING_FONTS in lib/validations/cart.ts, which is
 * what actually gets persisted on the cart line.
 *
 * The design's fifth face is Gveret Levin AlefAlefAlef, which next/font/google does not carry
 * (it is a Hebrew display family with almost no Latin coverage). Montez stands in for it — the
 * nearest available script — and is labelled honestly rather than under the Figma name.
 */
const montecarlo = MonteCarlo({ weight: '400', display: 'swap', subsets: ['latin'], variable: '--font-montecarlo' });
const nothingYouCouldDo = Nothing_You_Could_Do({ weight: '400', display: 'swap', subsets: ['latin'], variable: '--font-nothing-you-could-do' });
const marckScript = Marck_Script({ weight: '400', display: 'swap', subsets: ['latin'], variable: '--font-marck-script' });
const poltawskiNowy = Poltawski_Nowy({ display: 'swap', subsets: ['latin'], variable: '--font-poltawski-nowy' });
const montez = Montez({ weight: '400', display: 'swap', subsets: ['latin'], variable: '--font-montez' });
const galada = Galada({ weight: '400', display: 'swap', subsets: ['latin'], variable: '--font-galada' });
const gwendolyn = Gwendolyn({ weight: '700', display: 'swap', subsets: ['latin'], variable: '--font-gwendolyn' });

/** Every font variable class the Blushing Blooms page root must carry. */
export const blushingFontVars = [
  jedira.variable,
  montecarlo.variable,
  nothingYouCouldDo.variable,
  marckScript.variable,
  poltawskiNowy.variable,
  montez.variable,
  galada.variable,
  gwendolyn.variable,
].join(' ');

/** Picker options, in the order the design lays them out. */
export const WISHING_FONTS = [
  { key: 'montecarlo', label: 'MonteCarlo', css: 'var(--font-montecarlo), cursive' },
  { key: 'nothing-you-could-do', label: 'Nothing You Could Do', css: 'var(--font-nothing-you-could-do), cursive' },
  { key: 'marck-script', label: 'Marck Script', css: 'var(--font-marck-script), cursive' },
  { key: 'poltawski-nowy', label: 'Poltawski Nowy', css: 'var(--font-poltawski-nowy), Georgia, serif' },
  { key: 'montez', label: 'Montez', css: 'var(--font-montez), cursive' },
  { key: 'galada', label: 'Galada', css: 'var(--font-galada), cursive' },
] as const;

export type WishingFontKey = (typeof WISHING_FONTS)[number]['key'];

/** Resolve a stored font key to a CSS family; unknown/legacy keys fall back to the page sans. */
export const wishingFontCss = (key: string | null | undefined) =>
  WISHING_FONTS.find((f) => f.key === key)?.css ?? 'var(--font-sans), system-ui, sans-serif';

/** Fixed decorative face for the greeting-card preview heading (design: Gwendolyn Bold). */
export const GWENDOLYN_CSS = 'var(--font-gwendolyn), cursive';
