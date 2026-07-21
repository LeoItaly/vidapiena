/**
 * Brand-media prep — run locally on Leo's machine only (never in CI).
 *
 * Sources: visual-references/ (committed) → outputs into src/assets/ + public/.
 *  - Re-encodes the two logo-reveal MP4s to a web budget (target ≤ 2.5 MB each)
 *  - Converts the wall-composite PNGs into JPEG hero posters (LCP asset)
 *  - Builds the 1200×630 OG base image
 *  - Builds favicons from the round badge
 *
 * Usage: node scripts/prepare-media.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORTS = path.join(REPO, 'visual-references', 'exports');
const REFS = path.join(REPO, 'visual-references');
const OUT = {
  video: path.join(REPO, 'src', 'assets', 'video'),
  posters: path.join(REPO, 'src', 'assets', 'posters'),
  og: path.join(REPO, 'src', 'assets', 'og'),
  public: path.join(REPO, 'public'),
};
for (const dir of Object.values(OUT)) mkdirSync(dir, { recursive: true });

async function resolveFfmpeg() {
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (!probe.error) return 'ffmpeg';
  const { default: ffmpegStatic } = await import('ffmpeg-static');
  if (!ffmpegStatic || !existsSync(ffmpegStatic)) {
    throw new Error('No ffmpeg found. Install it or `npm i -D ffmpeg-static`.');
  }
  return ffmpegStatic;
}

function encodeVideo(ffmpeg, input, output, width, crf = 28) {
  const args = [
    '-y',
    '-i', input,
    '-c:v', 'libx264',
    '-crf', String(crf),
    '-preset', 'slow',
    '-vf', `scale=${width}:-2`,
    '-movflags', '+faststart',
    '-an',
    output,
  ];
  const res = spawnSync(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed for ${path.basename(input)}:\n${res.stderr}`);
  }
}

function report(file, budgetMB) {
  const mb = statSync(file).size / (1024 * 1024);
  const flag = budgetMB && mb > budgetMB ? `  ⚠ OVER ${budgetMB} MB budget` : '';
  console.log(`  ${path.basename(file).padEnd(28)} ${mb.toFixed(2)} MB${flag}`);
  return mb;
}

const ffmpeg = await resolveFfmpeg();

console.log('Videos:');
encodeVideo(
  ffmpeg,
  path.join(EXPORTS, 'logo-animation-16x9.mp4'),
  path.join(OUT.video, 'logo-reveal-16x9.mp4'),
  1920
);
report(path.join(OUT.video, 'logo-reveal-16x9.mp4'), 2.5);
encodeVideo(
  ffmpeg,
  path.join(EXPORTS, 'logo-animation-9x16.mp4'),
  path.join(OUT.video, 'logo-reveal-9x16.mp4'),
  1080
);
report(path.join(OUT.video, 'logo-reveal-9x16.mp4'), 2.5);

console.log('Posters:');
await sharp(path.join(EXPORTS, 'logo-wall-composite-16x9.png'))
  .resize({ width: 1920, withoutEnlargement: true })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(OUT.posters, 'hero-poster-16x9.jpg'));
report(path.join(OUT.posters, 'hero-poster-16x9.jpg'), 0.35);
await sharp(path.join(EXPORTS, 'logo-wall-composite-9x16.png'))
  .resize({ width: 1080, withoutEnlargement: true })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(OUT.posters, 'hero-poster-9x16.jpg'));
report(path.join(OUT.posters, 'hero-poster-9x16.jpg'), 0.35);

console.log('OG image:');
await sharp(path.join(EXPORTS, 'logo-wall-composite-16x9.png'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(OUT.og, 'og-base.jpg'));
report(path.join(OUT.og, 'og-base.jpg'), 0.3);

console.log('Favicons (from round badge):');
const badge = path.join(REFS, 'new-logo.jpeg');
for (const [size, name] of [
  [512, 'icon-512.png'],
  [180, 'apple-touch-icon.png'],
  [32, 'favicon.png'],
]) {
  await sharp(badge)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(OUT.public, name));
  report(path.join(OUT.public, name));
}

console.log('Done.');
