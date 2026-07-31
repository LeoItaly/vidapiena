/**
 * The block vocabulary, and the only route from what Francesco types to markdown.
 *
 * Constraint 7 of the plan: BlogPostPage.astro styles exactly
 * `p, h2, h3, ul, ol, li, a, img, blockquote` (plus `figure/figcaption`, added
 * with the caption field). Anything outside that renders unstyled on a live page
 * nobody is watching. A fixed block vocabulary makes that structurally
 * impossible — there is no code path from the editor to a table, an h1, or raw
 * HTML, because no block emits one.
 *
 * The subtle half is *inline* text. A paragraph is a plain string, so a stray
 * `#`, `*` or `<` typed mid-sentence would become markup. Everything therefore
 * goes through `inline()`, which permits exactly two constructs — `**bold**` and
 * `[testo](url)`, both inserted by editor buttons rather than typed — and escapes
 * every other markdown-significant character. Round-tripping through that is what
 * lets the editor store restricted markdown in a plain `<textarea>` (reliable on
 * an iOS keyboard, unlike contenteditable) without the text ever escaping the
 * subset.
 */

export type Block =
  | { k: 'p'; testo: string }
  | { k: 'h2'; testo: string }
  | { k: 'h3'; testo: string }
  | { k: 'ul'; voci: string[] }
  | { k: 'ol'; voci: string[] }
  | { k: 'quote'; testo: string }
  | { k: 'foto'; fotoId: string; alt: string; didascalia?: string };

export const BLOCK_LABELS: Record<Block['k'], string> = {
  p: 'Paragrafo',
  h2: 'Sottotitolo',
  h3: 'Sotto-sottotitolo',
  ul: 'Elenco puntato',
  ol: 'Elenco numerato',
  quote: 'Citazione',
  foto: 'Foto',
};

/**
 * Links we are willing to emit. A tour link is relative (`../../tour/<slug>/`)
 * so it resolves identically under `/blog/` and `/en/blog/` — that is why the
 * five existing articles use that form. External links are https only:
 * `javascript:` in a markdown link is a real XSS vector, and this content is
 * rendered on the public marketing site.
 */
const SAFE_LINK = /^(?:\.\.\/[./a-z0-9-]*|https:\/\/[^\s()<>"']+)$/i;

/** Markdown-significant characters that must never survive as literal text. */
const ESCAPE = /([\\`*_[\]<>])/g;

/**
 * Whether a character sits on an emphasis boundary — i.e. an adjacent `_` may open
 * or close italics. Mirrors CommonMark's rule that underscores do not emphasise
 * inside a word: only a string edge, whitespace, or punctuation qualifies, so
 * `dall'_alba_` italicises but `re_almente_` stays literal. Shared with
 * preview-html.ts, so the preview and the published page agree on which `_..._`
 * are italics — the property the whole preview rests on.
 */
export function isEmphasisBoundary(c: string | undefined): boolean {
  return c === undefined || !/[\p{L}\p{N}]/u.test(c);
}

function escapeText(text: string): string {
  return text.replace(ESCAPE, '\\$1');
}

/**
 * Neutralises constructs that only mean something at the *start* of a block.
 *
 * Applied once to the finished string rather than inside `escapeText`, because
 * that runs character by character and a one-character window can never match
 * `"1. "` or `"## "`. Getting this wrong is not cosmetic: a paragraph beginning
 * "1. " would render as an ordered list, and one beginning "# " as an h1 — the
 * single element BlogPostPage.astro does not style, on a live page.
 *
 * Only ASCII punctuation may carry a markdown backslash escape, so the digits in
 * "1." are left alone and the dot is escaped instead. `\1.` would render as the
 * literal characters backslash-one-dot.
 */
function escapeBlockStart(text: string): string {
  return text
    .replace(/^(#{1,6}\s)/, '\\$1')
    .replace(/^([-+]\s)/, '\\$1')
    .replace(/^(\d+)([.)]\s)/, '$1\\$2')
    .replace(/^\|/, '\\|');
}

/**
 * Re-serialises restricted markdown, keeping the two permitted constructs and
 * escaping everything else.
 *
 * Parsing and re-emitting rather than passing the string through is deliberate:
 * it means a paragraph is *validated*, not trusted. A malformed `[x](` or a
 * `[x](javascript:…)` degrades to literal text instead of reaching the page.
 */
export function inline(text: string): string {
  const flat = text.replace(/\r\n?/g, '\n').replace(/\s*\n\s*/g, ' ').trim();
  let out = '';
  let i = 0;

  while (i < flat.length) {
    if (flat.startsWith('**', i)) {
      const end = flat.indexOf('**', i + 2);
      const inner = end === -1 ? null : flat.slice(i + 2, end);
      if (inner && inner.trim() && !inner.includes('**')) {
        out += `**${escapeText(inner)}**`;
        i = end + 2;
        continue;
      }
    }

    // Italics: `_word_`, only on a word boundary so the emitted markdown is
    // something remark actually emphasises (and so the preview, which applies the
    // same rule, matches the published page). The inner text carries no edge
    // whitespace — the toolbar trims the selection — which is what CommonMark
    // requires of an underscore run.
    if (flat[i] === '_') {
      const end = flat.indexOf('_', i + 1);
      const inner = end === -1 ? null : flat.slice(i + 1, end);
      if (
        inner &&
        inner === inner.trim() &&
        !inner.includes('_') &&
        isEmphasisBoundary(flat[i - 1]) &&
        isEmphasisBoundary(flat[end + 1])
      ) {
        out += `_${escapeText(inner)}_`;
        i = end + 1;
        continue;
      }
    }

    if (flat[i] === '[') {
      const close = flat.indexOf('](', i);
      if (close !== -1) {
        const end = flat.indexOf(')', close + 2);
        const label = flat.slice(i + 1, close);
        const href = flat.slice(close + 2, end);
        if (end !== -1 && label.trim() && SAFE_LINK.test(href)) {
          out += `[${escapeText(label)}](${href})`;
          i = end + 1;
          continue;
        }
      }
    }

    out += escapeText(flat[i]!);
    i += 1;
  }

  return escapeBlockStart(out);
}

/** Raw-HTML context (the `<figcaption>`), so this is HTML escaping, not markdown. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The path form every existing article uses. It is relative to
 * `src/content/blog/<locale>/<slug>.md`, which is what makes Astro's asset
 * pipeline pick the image up and emit AVIF/WebP derivatives — an absolute or
 * public-folder path would ship the raw JPEG instead.
 */
export function photoPath(key: string): string {
  return `../../../assets/photos/${key}.jpg`;
}

/**
 * A `foto` block whose image is already committed to the repo (i.e. the article
 * was opened for editing from a published `.md`) carries this sentinel as its
 * `fotoId`, followed by the committed `<key>`. A staged upload's id is an opaque
 * KV id and never starts with this. The distinction is load-bearing at publish:
 * a `pub:` photo is passed through by key with no blob upload, because its bytes
 * are not in KV — they are already in git.
 */
export const PUB_PREFIX = 'pub:';

export function isPublishedPhoto(fotoId: string): boolean {
  return fotoId.startsWith(PUB_PREFIX);
}

/** `pub:blog-x-01` → `blog-x-01`. Only meaningful when `isPublishedPhoto` is true. */
export function publishedKey(fotoId: string): string {
  return fotoId.slice(PUB_PREFIX.length);
}

/**
 * `resolveKey` maps the editor's opaque photo id to its final `blog-<slug>-NN`
 * key. The indirection exists because the slug comes from a title he can still be
 * editing (see photo-store.ts) — names are assigned once, at publish.
 */
export function blocksToMarkdown(
  blocks: Block[],
  resolveKey: (fotoId: string) => string | null,
): string {
  const out: string[] = [];

  for (const block of blocks) {
    switch (block.k) {
      case 'p': {
        const t = inline(block.testo);
        if (t) out.push(t);
        break;
      }
      case 'h2':
      case 'h3': {
        const t = inline(block.testo);
        // A heading must be one line; a newline would end the heading and dump
        // the rest into an unstyled node.
        if (t) out.push(`${block.k === 'h2' ? '##' : '###'} ${t.replace(/\n/g, ' ')}`);
        break;
      }
      case 'ul':
      case 'ol': {
        const items = block.voci.map((v) => inline(v)).filter(Boolean);
        if (items.length) {
          out.push(
            items.map((v, n) => (block.k === 'ul' ? `- ${v}` : `${n + 1}. ${v}`)).join('\n'),
          );
        }
        break;
      }
      case 'quote': {
        const t = inline(block.testo);
        // Every line needs its own `>` or the quote silently ends at the first
        // line break and the remainder renders as body text.
        if (t) out.push(t.split('\n').map((l) => `> ${l}`).join('\n'));
        break;
      }
      case 'foto': {
        const key = resolveKey(block.fotoId);
        // A photo whose key cannot be resolved is dropped rather than emitted as
        // a broken path: `astro:assets` fails the BUILD on a missing image, and a
        // failed build is the one error Francesco cannot act on.
        if (!key) break;
        const alt = escapeText(block.alt.replace(/\s+/g, ' ').trim());
        const img = `![${alt}](${photoPath(key)})`;
        const caption = block.didascalia?.replace(/\s+/g, ' ').trim();
        out.push(
          caption
            ? `<figure>\n\n${img}\n\n<figcaption>${escapeHtml(caption)}</figcaption>\n</figure>`
            : img,
        );
        break;
      }
    }
  }

  return out.join('\n\n');
}

/** Every photo the article actually references, in order, deduplicated. */
export function referencedPhotoIds(blocks: Block[]): string[] {
  const seen = new Set<string>();
  for (const b of blocks) if (b.k === 'foto' && b.fotoId) seen.add(b.fotoId);
  return [...seen];
}

/** Plain text of the article, for the word count and the auto-summary hint. */
export function plainText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.k) {
        case 'p':
        case 'h2':
        case 'h3':
        case 'quote':
          return b.testo;
        case 'ul':
        case 'ol':
          return b.voci.join(' ');
        case 'foto':
          return '';
      }
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
