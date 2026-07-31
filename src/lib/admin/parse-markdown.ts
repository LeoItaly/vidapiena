/**
 * Reading a published article back into the editor.
 *
 * This is the exact inverse of `blocksToMarkdown` (blocks.ts) plus a minimal
 * reader for the frontmatter `buildArticleFile` (frontmatter.ts) writes. Its whole
 * reason to exist: an article that is already online — one of the five hand-written
 * seeds, or anything published through the back office whose draft has since
 * expired — must be re-openable in the block editor. There was no path back before
 * this file; the editor was effectively create-only.
 *
 * ## The contract it inverts
 *
 * The serialiser only ever emits the restricted vocabulary BlogPostPage.astro
 * styles: `p`, `## `/`### `, `- `/`1. `, `> `, `![alt](path)` and the
 * `<figure><figcaption>` form for a captioned photo, with inline text limited to
 * `**bold**`, `_italic_` and `[label](url)`. So this parser only needs to
 * recognise that same closed set — anything it does not recognise degrades to a
 * plain paragraph rather than being invented into a block kind the rest of the
 * system cannot serialise.
 *
 * ## Committed photos
 *
 * A published image lives in git as `src/assets/photos/<key>.jpg`, not in KV. It
 * is represented as a `foto` block whose `fotoId` is the sentinel `pub:<key>`
 * (see `PUB_PREFIX`), which the editor and preview render from the repo and which
 * the publish step passes through untouched instead of re-uploading. That keeps a
 * text-only edit from having to re-commit every photo.
 *
 * ## Round-trip
 *
 * `blocks -> blocksToMarkdown -> markdownToBlocks` must return equivalent blocks;
 * scripts/verify-build.mjs asserts it, which is what keeps this file honest as the
 * serialiser evolves.
 */

import type { Block } from './blocks';
import { PUB_PREFIX } from './blocks';

/** `../../../assets/photos/<key>.jpg` -> `<key>`. The only image path the serialiser writes. */
const PHOTO_PATH = /(?:\.\.\/)*assets\/photos\/([a-z0-9][a-z0-9-]*)\.jpg$/i;
/** A standalone image line: `![alt](path)`. */
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/;
const HEADING = /^(#{2,3})\s+(.*)$/;
const BULLET = /^[-+]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;

/** `\*` -> `*`. The serialiser escapes markdown-significant characters; undo that
 * so the textarea shows what he typed, while `**bold**`/`_italic_`/`[](…)` (whose
 * markers are never escaped) survive intact. */
function unescapeInline(text: string): string {
  return text.replace(/\\([\\`*_[\]<>#+\-.|])/g, '$1');
}

/** Reverses the `<figcaption>` HTML escaping in `blocksToMarkdown`. */
function unescapeHtml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function photoBlock(altRaw: string, path: string, caption?: string): Block | null {
  const m = PHOTO_PATH.exec(path.trim());
  if (!m) return null;
  const alt = unescapeInline(altRaw).replace(/\s+/g, ' ').trim();
  const didascalia = caption ? unescapeHtml(caption).replace(/\s+/g, ' ').trim() : '';
  return {
    k: 'foto',
    fotoId: `${PUB_PREFIX}${m[1]}`,
    alt,
    ...(didascalia ? { didascalia } : {}),
  };
}

/**
 * Turns the markdown body of a published article back into editor blocks.
 *
 * Line-oriented rather than split-on-blank-line, because the `<figure>` form the
 * serialiser emits contains its own blank lines — splitting on `\n\n` would tear a
 * captioned photo into three fragments.
 */
export function markdownToBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  const takeWhile = (test: (l: string) => boolean): string[] => {
    const out: string[] = [];
    while (i < lines.length && test(lines[i]!)) out.push(lines[i++]!);
    return out;
  };

  while (i < lines.length) {
    const line = lines[i]!;

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // A captioned photo: <figure> … ![alt](path) … <figcaption>…</figcaption> … </figure>
    if (/^<figure>/.test(line.trim())) {
      const chunk = takeWhile((l) => !/<\/figure>/.test(l));
      if (i < lines.length) chunk.push(lines[i++]!); // consume the </figure> line
      const joined = chunk.join('\n');
      const img = /!\[([^\]]*)\]\(([^)]+)\)/.exec(joined);
      const cap = /<figcaption>([\s\S]*?)<\/figcaption>/.exec(joined);
      const foto = img ? photoBlock(img[1]!, img[2]!, cap?.[1]) : null;
      if (foto) blocks.push(foto);
      continue;
    }

    // A bare image line.
    const image = IMAGE_LINE.exec(line);
    if (image) {
      const foto = photoBlock(image[1]!, image[2]!);
      if (foto) blocks.push(foto);
      i += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ k: heading[1] === '##' ? 'h2' : 'h3', testo: unescapeInline(heading[2]!.trim()) });
      i += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      const quoted = takeWhile((l) => QUOTE.test(l)).map((l) => unescapeInline(QUOTE.exec(l)![1]!));
      blocks.push({ k: 'quote', testo: quoted.join('\n').trim() });
      continue;
    }

    if (BULLET.test(line)) {
      const voci = takeWhile((l) => BULLET.test(l)).map((l) => unescapeInline(BULLET.exec(l)![1]!));
      blocks.push({ k: 'ul', voci });
      continue;
    }

    if (ORDERED.test(line)) {
      const voci = takeWhile((l) => ORDERED.test(l)).map((l) => unescapeInline(ORDERED.exec(l)![1]!));
      blocks.push({ k: 'ol', voci });
      continue;
    }

    // Anything else is a paragraph: gather the wrapped lines until a blank line or
    // the start of another construct, and collapse them to one line the way the
    // serialiser does.
    const para = takeWhile(
      (l) =>
        l.trim() !== '' &&
        !/^<figure>/.test(l.trim()) &&
        !IMAGE_LINE.test(l) &&
        !HEADING.test(l) &&
        !QUOTE.test(l) &&
        !BULLET.test(l) &&
        !ORDERED.test(l),
    );
    const testo = unescapeInline(para.join(' ').replace(/\s+/g, ' ').trim());
    if (testo) blocks.push({ k: 'p', testo });
  }

  return blocks;
}

export interface ArticleFront {
  title: string;
  description: string;
  date: string;
  cover: string;
  updated: string;
  draft: boolean;
}

/** Splits a `---`-fenced file into its frontmatter block and body. */
export function splitFrontmatter(file: string): { frontmatter: string; body: string } | null {
  const text = file.replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end === -1) return null;
  const frontmatter = text.slice(4, end);
  const body = text.slice(text.indexOf('\n', end + 1) + 1);
  return { frontmatter, body };
}

/** Reads a single-quoted or bare YAML scalar the way `buildArticleFile` writes it. */
function scalar(frontmatter: string, key: string): string {
  const m = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm').exec(frontmatter);
  if (!m) return '';
  const raw = m[1]!.trim();
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1).replace(/''/g, "'");
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  return raw;
}

/** Parses the frontmatter a published article carries. The fallback reader used
 * only when the content-collection entry's raw body is not to hand. */
export function parseFrontmatter(frontmatter: string): ArticleFront {
  return {
    title: scalar(frontmatter, 'title'),
    description: scalar(frontmatter, 'description'),
    date: scalar(frontmatter, 'date').slice(0, 10),
    cover: scalar(frontmatter, 'cover'),
    updated: scalar(frontmatter, 'updated').slice(0, 10),
    draft: scalar(frontmatter, 'draft') === 'true',
  };
}

/**
 * Flips the `draft:` flag on an already-committed article file, touching nothing
 * else. Used by "take offline" / "put back online": a targeted line edit is safer
 * than re-serialising the whole file, which could perturb the body.
 */
export function setDraftFlag(file: string, draft: boolean): string {
  const text = file.replace(/\r\n?/g, '\n');
  const split = splitFrontmatter(text);
  if (!split) return text;
  const value = draft ? 'true' : 'false';
  const front = /^draft:[ \t]*(true|false)[ \t]*$/m.test(split.frontmatter)
    ? split.frontmatter.replace(/^draft:[ \t]*(true|false)[ \t]*$/m, `draft: ${value}`)
    : `${split.frontmatter}\ndraft: ${value}`;
  return `---\n${front}\n---\n${split.body}`;
}
