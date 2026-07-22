/**
 * Regenerates the site icons from the official circular badge
 * (visual-references/new-logo.jpeg). Run manually after a logo change:
 *
 *   node scripts/make-icons.mjs
 *
 * Outputs (filenames referenced by BaseHead.astro / JsonLd.astro):
 *   public/favicon.png           32×32, transparent outside the circle
 *   public/apple-touch-icon.png  180×180, ink background, 12% padding
 *   public/icon-512.png          512×512, transparent outside the circle
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'visual-references', 'new-logo.jpeg');
const OUT = path.join(root, 'public');
const INK = { r: 16, g: 21, b: 15, alpha: 1 };

/* The master is a perfect circle inscribed in a black square; a 4% overscan
   crop puts the yellow ring on the edge (same trick as BrandBadge.astro). */
async function disc(size) {
  const over = Math.round(size * 1.04);
  const off = Math.floor((over - size) / 2);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  return sharp(SRC)
    .resize(over, over)
    .extract({ left: off, top: off, width: size, height: size })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function writeIcon(file, size, { pad = 0, background = null } = {}) {
  const d = await disc(size - pad * 2);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: d, left: pad, top: pad }])
    .png()
    .toFile(path.join(OUT, file));
  console.log(`ok ${file} (${size}x${size})`);
}

await writeIcon('favicon.png', 32);
await writeIcon('apple-touch-icon.png', 180, { pad: Math.round(180 * 0.12), background: INK });
await writeIcon('icon-512.png', 512);
