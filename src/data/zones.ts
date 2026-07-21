/**
 * The 5 descent zones — the spine of the scroll experience (304 m → 0 m).
 * Portuguese labels are brand voice (identical in both locales); glosses and
 * facts live in the i18n dictionaries keyed by `id`.
 */

export type ZoneId = 'mirante' | 'lajes' | 'becos' | 'ladeira' | 'asfalto';

export interface Zone {
  id: ZoneId;
  labelPt: string;
  /** Altitude band start (m) — the HUD interpolates linearly to the next zone's start. */
  altitude: number;
  /** Photo key into src/assets/photos/ */
  image: string;
  /** Palette stop driving the color grade while this zone is active. */
  gradeVar: '--color-alba' | '--color-giorno' | '--color-oro' | '--color-crepuscolo';
}

export const ALTITUDE_TOP = 304;

export const ZONES: Zone[] = [
  { id: 'mirante', labelPt: 'O Mirante', altitude: 304, image: 'zone-1-mirante', gradeVar: '--color-alba' },
  { id: 'lajes', labelPt: 'As Lajes', altitude: 230, image: 'zone-2-lajes', gradeVar: '--color-giorno' },
  { id: 'becos', labelPt: 'Os Becos', altitude: 150, image: 'zone-3-becos', gradeVar: '--color-giorno' },
  { id: 'ladeira', labelPt: 'A Ladeira', altitude: 70, image: 'zone-4-ladeira', gradeVar: '--color-oro' },
  { id: 'asfalto', labelPt: 'O Asfalto', altitude: 0, image: 'zone-5-asfalto', gradeVar: '--color-crepuscolo' },
];
