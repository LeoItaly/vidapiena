/**
 * Turns an Italian article title into the URL it will live at, forever.
 *
 * "Forever" is the whole design constraint: the slug is frozen at first publish
 * (plan, Part 4) because a live URL that changes is a 404 for everyone who shared
 * it, and Francesco has no way to see that happen or to fix it. So this has to be
 * right the first time, for titles that will contain apostrophes, colons, accents
 * and — because it is a phone keyboard — emoji.
 *
 * It matches the five slugs already in src/content/blog by construction:
 * "Visitare una favela è sicuro?" → visitare-una-favela-e-sicuro.
 */

/** Long enough to stay descriptive, short enough to survive a phone address bar. */
const MAX_LENGTH = 70;

/**
 * Typographic apostrophes are what an iPhone actually inserts — the straight `'`
 * barely appears in real input. Both become a word break, because in Italian they
 * genuinely separate words: "L'alba" is two, and `lalba` reads as neither.
 */
const APOSTROPHES = /[’'`´ʼ]/g;

export function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    // Strip combining marks, so è→e, à→a, ç→c. Done before the character filter
    // so the base letter survives instead of the whole character being dropped.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(APOSTROPHES, '-')
    .toLowerCase()
    // Everything that is not a plain letter or digit becomes a break. Emoji,
    // punctuation, em dashes and non-Latin scripts all fall out here rather than
    // being percent-encoded into an unreadable URL.
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) return '';
  if (slug.length <= MAX_LENGTH) return slug;

  // Cut on a word boundary, never mid-word: a truncated slug is read by people.
  const cut = slug.slice(0, MAX_LENGTH);
  const lastBreak = cut.lastIndexOf('-');
  return (lastBreak > MAX_LENGTH * 0.6 ? cut.slice(0, lastBreak) : cut).replace(/-+$/, '');
}

/**
 * A slug that is guaranteed usable, even when the title yields nothing.
 *
 * A title of pure emoji, or one written in a script we strip, produces an empty
 * slug — and an empty slug is a file called `.md` that silently collides with
 * every other one. `date` is passed in rather than read from the clock so the
 * result is deterministic and testable.
 */
export function slugForTitle(title: string, date: Date): string {
  return slugify(title) || `articolo-${date.toISOString().slice(0, 10)}`;
}

/**
 * Resolves a collision by suffixing, never by silently overwriting.
 *
 * Two articles about Rocinha are entirely plausible, and the second one must not
 * replace the first. `-2`, `-3` … is the WordPress convention and is what a
 * reader expects a duplicate URL to look like.
 */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  // 999 articles with the same title is not a case worth designing for, but
  // returning something colliding would be, so fall through to a stamped slug.
  return `${base}-${Date.now().toString(36)}`;
}
