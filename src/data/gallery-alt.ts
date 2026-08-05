/**
 * Optional descriptive alt text per photo key, for the tour deck. PARTIAL by
 * design: a key with no entry falls back to a generic (but non-positional)
 * "<tour> — <heading>" alt in TourGallery. Only add entries you can describe
 * accurately — alt text must match the actual image. The seeded entries below
 * cover the semantically-named "zone-*" photos; extend the map over time.
 */
import type { Locale } from '../i18n';

export const GALLERY_ALT: Record<string, Record<Locale, string>> = {
  'zone-1-mirante': {
    it: 'Vista panoramica dal mirante del Vidigal sulla costa e sull’oceano',
    en: 'Panoramic view from the Vidigal lookout over the coast and the ocean',
  },
  'zone-2-lajes': {
    it: 'I tetti e le lajes del Vidigal affacciati sul mare',
    en: 'The rooftops and terraces of Vidigal facing the sea',
  },
  'zone-3-becos': {
    it: 'Vicoli stretti della Rocinha lungo la discesa a piedi',
    en: 'The narrow alleys of Rocinha on the walk down',
  },
  'zone-4-ladeira': {
    it: 'La ripida ladeira che scende tra le case del Vidigal',
    en: 'The steep lane winding down between the houses of Vidigal',
  },
};
