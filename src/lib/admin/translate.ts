/**
 * The mandatory English twin.
 *
 * `BaseHead.astro` emits hreflang alternates **unconditionally**, so an Italian
 * article without an English counterpart is a live hreflang link to a 404. The
 * client writes only Italian and never sees the English, so this has to be both
 * automatic and safe to fail.
 *
 * Provider is Cloudflare Workers AI: free at this volume (10,000 neurons/day),
 * no second account, and already bound. `TRANSLATE_PROVIDER` selects an
 * alternative without touching a call site, so the first real article can be
 * judged on its merits rather than the decision being made now.
 *
 * ## What must survive translation untouched
 *
 * - **Relative photo paths** (`../../../assets/photos/<key>.jpg`) — a mangled
 *   path fails the *build*, and a failed build is an English stack trace in a
 *   log Francesco cannot read.
 * - **Relative tour links** (`../../tour/<slug>/`) — the slug is locale-invariant
 *   by design; "translating" it produces a 404.
 * - **The Portuguese brand words** — DESIGN.md: *O Mirante, As Lajes, Os Becos,
 *   A Ladeira, O Asfalto* are never translated, in any language.
 * - **Block structure** — `##`, `-`, `>` must stay exactly where they were, or
 *   the English twin renders as one long paragraph.
 *
 * Translating block-by-block rather than whole-document is what makes those
 * guarantees cheap: markup never reaches the model, only prose.
 */

import type { Block } from './blocks';

/** DESIGN.md's never-translate list. Case-sensitive: they are proper nouns. */
const BRAND_WORDS = ['O Mirante', 'As Lajes', 'Os Becos', 'A Ladeira', 'O Asfalto'];

export type Translator = (italian: string) => Promise<string>;

export interface WorkersAI {
  run(model: string, input: { messages: { role: string; content: string }[] }): Promise<unknown>;
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM = [
  'You translate Italian to English for a Rio de Janeiro tour guide’s travel blog.',
  'Return ONLY the translation. No preamble, no quotes, no explanation.',
  'Keep the first-person, warm, plain voice. British English.',
  'NEVER translate these Portuguese place names, keep them exactly as written:',
  BRAND_WORDS.join(', ') + '.',
  'Keep any text inside [square brackets] and (parentheses) exactly as it is — they are links.',
  'Keep **double asterisks** exactly where they are — they mark bold.',
  'If the input is empty, return nothing.',
].join(' ');

/**
 * A translator backed by the Workers AI binding.
 *
 * Returns the Italian unchanged on any failure rather than throwing. A half
 * English article is worse than an untranslated one: the Italian at least reads
 * correctly and the hreflang pair still resolves, so the page is valid and Leo
 * can fix the wording later. A thrown error at this point would strand a publish
 * half-way, which the plan explicitly forbids.
 */
export function workersAiTranslator(ai: WorkersAI | null): Translator {
  return async (italian: string) => {
    const testo = italian.trim();
    if (!testo || !ai) return italian;
    try {
      const out = (await ai.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: testo },
        ],
      })) as { response?: string };
      const english = (out?.response ?? '').trim();
      return english ? restoreBrandWords(english, testo) : italian;
    } catch {
      return italian;
    }
  };
}

/**
 * Puts back any brand word the model translated anyway.
 *
 * Instructions are not a guarantee with an 8B model, and DESIGN.md's rule is not
 * a preference — these names are how the tours are sold. Only words that were in
 * the Italian are restored, so this cannot invent one.
 */
function restoreBrandWords(english: string, italian: string): string {
  let out = english;
  for (const word of BRAND_WORDS) {
    if (!italian.includes(word)) continue;
    if (out.includes(word)) continue;
    // "The Mirante", "the Lajes", "The Becos" — the article is what the model
    // tends to translate, leaving the noun.
    const noun = word.replace(/^(O|A|As|Os)\s+/, '');
    out = out.replace(new RegExp(`\\b(the\\s+)?${noun}\\b`, 'gi'), word);
  }
  return out;
}

/**
 * Translates the parts of a draft that are prose, and nothing else.
 *
 * Photo ids, block kinds and the ordering are copied verbatim — the English twin
 * references the same photo files, which is why one commit carries both articles
 * and one set of images.
 */
export async function translateBlocks(
  blocks: Block[],
  translate: Translator,
): Promise<Block[]> {
  const out: Block[] = [];
  for (const b of blocks) {
    switch (b.k) {
      case 'p':
      case 'h2':
      case 'h3':
      case 'quote':
        out.push({ ...b, testo: await translate(b.testo) });
        break;
      case 'ul':
      case 'ol': {
        const voci: string[] = [];
        for (const v of b.voci) voci.push(await translate(v));
        out.push({ ...b, voci });
        break;
      }
      case 'foto':
        // Alt text is translated (it is read aloud in English) but the caption
        // and the photo id are not re-keyed: same file, same crop, same order.
        out.push({
          ...b,
          alt: await translate(b.alt),
          ...(b.didascalia ? { didascalia: await translate(b.didascalia) } : {}),
        });
        break;
    }
  }
  return out;
}
