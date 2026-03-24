/**
 * Soft Pink Palette — from pinky.jpg
 *   #E6789A  deep rose     (darkest in palette)
 *   #F08CA9  medium rose
 *   #F5A6BD  light pink
 *   #F9C1D3  palest pink   (lightest in palette)
 *
 * Derived darker shades (darker versions of the same rose family):
 *   #C45A7E  dark rose     — sidebar accents, hover
 *   #9E3560  deep rose     — sidebar background
 *   #7A2648  darkest text  — headings on light bg
 *
 * Neutrals that pair with the palette:
 *   #FBF7F8  warm off-white  — page background
 *   #FFF8FB  almost white    — card background
 *   #FFFFFF  pure white
 */
export const C = {
  p1:     '#E6789A',   // deep rose      — primary buttons, sidebar, badges
  p2:     '#F08CA9',   // medium rose    — secondary, table header
  p3:     '#F5A6BD',   // light pink     — borders, dividers, card strips
  p4:     '#F9C1D3',   // palest pink    — very light bg, input bg

  dark:   '#C45A7E',   // darker p1 — hover states
  deep:   '#9E3560',   // sidebar bg gradient end
  text:   '#7A2648',   // dark readable text on light bg

  bg:     '#FBF7F8',   // page background
  card:   '#FFF8FB',   // card / panel background
  white:  '#FFFFFF',
};

/* Province header gradients — all within the rose family */
export const PROV_GRAD = [
  `linear-gradient(135deg, #E6789A, #9E3560)`,
  `linear-gradient(135deg, #C45A7E, #7A2648)`,
  `linear-gradient(135deg, #F08CA9, #C45A7E)`,
  `linear-gradient(135deg, #9E3560, #7A2648)`,
  `linear-gradient(135deg, #E6789A, #C45A7E)`,
];

/* Pie-chart fill colors — shades from the same rose spectrum */
export const PIE_COLORS = [
  '#E6789A', '#9E3560', '#F08CA9', '#C45A7E', '#F5A6BD',
  '#7A2648', '#F9C1D3', '#D4699A', '#B85280',
];

export const REG_PIE  = ['#E6789A', '#F5A6BD'];       // New / Renew
export const LTO_PIE  = ['#F9C1D3', '#E6789A'];       // Updated / Expired
