/**
 * Renders a draft's blocks to the HTML the published article will have.
 *
 * ## Why this exists rather than "just render BlogPostPage.astro"
 *
 * The plan says preview should use the real component, and structurally it
 * cannot: `BlogPostPage.astro` calls `render(post)` on a **content-collection
 * entry**, which only exists for a file already committed to
 * `src/content/blog/`. A draft is not a file. Running Astro's markdown pipeline
 * at request time would mean shipping remark into the Worker and spending its
 * 10 ms CPU budget on it.
 *
 * So the preview renders the blocks directly — and the honesty of that is
 * *testable*, not assumed: the same blocks go through
 * `blocksToMarkdown → Astro → HTML` at publish, and a build-time comparison of
 * the two outputs is what keeps this function truthful. It emits exactly the
 * element vocabulary BlogPostPage styles (p, h2, h3, ul, ol, li, a, img,
 * blockquote, figure, figcaption) and the preview page reuses that stylesheet,
 * so what he sees is what gets published.
 */

import type { Block } from './blocks';

/** Text destined for an HTML text node or attribute. */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Astro's markdown pipeline runs SmartyPants over text nodes, so `dall'alba`
 * publishes as `dall’alba` with a typographic apostrophe. Without this the
 * preview showed straight quotes and the live page curly ones — the single
 * difference left between the two renderings when they were diffed.
 *
 * Applied to **text only**, never to a link destination: a `--` or `'` inside a
 * URL must survive intact, and remark leaves destinations alone for the same
 * reason. It is also deliberately NOT applied to a caption, because a caption is
 * emitted as raw HTML inside `<figure>` and markdown does not touch it — verified
 * by diffing the built page.
 */
function typographic(text: string): string {
  return text
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/\.\.\./g, '…')
    .replace(/"([^"]*)"/g, '“$1”')
    .replace(/'/g, '’');
}

/**
 * Renders the same restricted inline vocabulary `blocks.ts` permits — `**bold**`
 * and `[text](url)` — and nothing else.
 *
 * Tokenised rather than regex-replaced over the whole string, so typography and
 * escaping apply to prose while a link's `href` passes through untouched.
 * A markdown backslash escape (`\*`, `\#`) is unwrapped to the character it
 * protects, matching what a markdown renderer does with it.
 */
export function inlineHtml(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const prosa = (s: string) => esc(typographic(unescapeMd(s)));
  let out = '';
  let i = 0;
  let plain = '';

  const flush = () => {
    out += prosa(plain);
    plain = '';
  };

  while (i < flat.length) {
    if (flat.startsWith('**', i)) {
      const end = flat.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        out += `<strong>${prosa(flat.slice(i + 2, end))}</strong>`;
        i = end + 2;
        continue;
      }
    }
    if (flat[i] === '[') {
      const close = flat.indexOf('](', i);
      const end = close === -1 ? -1 : flat.indexOf(')', close + 2);
      const href = end === -1 ? '' : flat.slice(close + 2, end);
      if (end !== -1 && /^(?:\.\.\/[./a-z0-9-]*|https:\/\/[^\s()<>"']+)$/i.test(href)) {
        flush();
        out += `<a href="${esc(href)}">${prosa(flat.slice(i + 1, close))}</a>`;
        i = end + 1;
        continue;
      }
    }
    plain += flat[i];
    i += 1;
  }
  flush();
  return out;
}

/** `\*` → `*`. The serialiser adds these; a renderer consumes them. */
function unescapeMd(text: string): string {
  return text.replace(/\\([\\`*_[\]<>#+\-.|])/g, '$1');
}

export interface PreviewPhoto {
  id: string;
  alt: string;
}

/**
 * `photoSrc` resolves a draft photo id to a URL the browser can load — in
 * practice `/admin/api/foto?bozza=…&foto=…`, which serves the pending bytes
 * straight out of KV.
 */
export function blocksToPreviewHtml(
  blocks: Block[],
  photoSrc: (fotoId: string) => string | null,
): string {
  const out: string[] = [];

  for (const b of blocks) {
    switch (b.k) {
      case 'p': {
        const t = inlineHtml(b.testo);
        if (t) out.push(`<p>${t}</p>`);
        break;
      }
      case 'h2':
      case 'h3': {
        const t = inlineHtml(b.testo);
        if (t) out.push(`<${b.k}>${t}</${b.k}>`);
        break;
      }
      case 'ul':
      case 'ol': {
        const items = b.voci.map((v) => inlineHtml(v)).filter(Boolean);
        if (items.length) {
          out.push(`<${b.k}>${items.map((i) => `<li>${i}</li>`).join('')}</${b.k}>`);
        }
        break;
      }
      case 'quote': {
        const t = inlineHtml(b.testo);
        // Astro's markdown wraps a blockquote's content in a paragraph; matching
        // that keeps the preview's spacing identical to the published page.
        if (t) out.push(`<blockquote><p>${t}</p></blockquote>`);
        break;
      }
      case 'foto': {
        const src = photoSrc(b.fotoId);
        if (!src) break;
        const img = `<p><img src="${esc(src)}" alt="${esc(b.alt)}" loading="lazy" decoding="async"></p>`;
        const caption = b.didascalia?.trim();
        out.push(
          caption
            ? `<figure>${img}<figcaption>${esc(caption)}</figcaption></figure>`
            : img,
        );
        break;
      }
    }
  }

  return out.join('\n');
}
