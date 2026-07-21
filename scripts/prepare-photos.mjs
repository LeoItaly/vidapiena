/**
 * Photo pipeline — run locally on Leo's machine only (never in CI).
 *
 * The ONLY sanctioned bridge from the sensitive parent folder (VidaPiena-Project/media/,
 * local-only) into this public repo. Reads the curated manifest, re-encodes each pick with
 * sharp — auto-rotate, resize, mozjpeg — and writes to src/assets/photos/.
 * EXIF/GPS metadata is stripped by design (sharp default: no .withMetadata()).
 *
 * Manifest (scripts/photo-manifest.json):
 *   [{ "src": "media/<folder>/<file>.jpeg", "out": "zone-1-mirante.jpg", "maxW": 2400 }]
 * `src` is relative to the PARENT project folder.
 *
 * Usage: node scripts/prepare-photos.mjs
 */
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PARENT = path.resolve(REPO, '..');
const OUT_DIR = path.join(REPO, 'src', 'assets', 'photos');
mkdirSync(OUT_DIR, { recursive: true });

const manifest = JSON.parse(
  readFileSync(path.join(REPO, 'scripts', 'photo-manifest.json'), 'utf8')
);

let total = 0;
for (const { src, out, maxW = 2400 } of manifest) {
  const input = path.resolve(PARENT, src);
  const output = path.join(OUT_DIR, out);
  await sharp(input)
    .rotate() // apply EXIF orientation before the metadata is dropped
    .resize({ width: maxW, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(output);
  const kb = statSync(output).size / 1024;
  total += kb;
  const flag = kb > 400 ? '  ⚠ over 400 KB' : '';
  console.log(`  ${out.padEnd(28)} ${kb.toFixed(0).padStart(4)} KB${flag}`);
}
console.log(`\n${manifest.length} photos, ${(total / 1024).toFixed(2)} MB total.`);
