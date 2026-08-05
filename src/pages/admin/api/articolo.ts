/**
 * Acting on an article that is already online.
 *
 * The rest of the back office only ever *created* articles: the editor writes a
 * draft, the publish loop commits it. Everything here is about an article that is
 * already live in `src/content/blog/`.
 *
 *  - `apri-modifica` re-opens a published article in the block editor. It reads
 *    the committed markdown, turns it back into blocks (parse-markdown.ts), and
 *    seeds a draft carrying the article's frozen slug — so re-publishing is an
 *    "Aggiorna" that overwrites the same files under the same URL, not a new post.
 *    Committed photos come back as `pub:<key>` blocks (see blocks.ts / the publish
 *    step), which the editor renders from the repo and the publish step passes
 *    through untouched.
 *  - `ritira` / `ripristina` take an article offline and back. "Offline" is
 *    reversible by design: it flips `draft: true` on both the Italian file and its
 *    English twin and commits — the build drops `draft:true` from the collection,
 *    so the page, the index entry and the hreflang pair all disappear together
 *    (no dangling hreflang), and the content stays in git to be restored.
 *
 * ⚠️ `prerender = false` is load-bearing (see scrivi.astro). Auth + CSRF are as in
 * bozza.ts: middleware answers 401 JSON for /admin/api/*, and Astro's checkOrigin
 * covers CSRF.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { GITHUB_TOKEN, GITHUB_REPO } from 'astro:env/server';
import { getCollection } from 'astro:content';
import { getKV } from '../../../lib/admin/runtime';
import { asListable, type DraftMetadata } from '../../../lib/admin/kv-list';
import { draftKey, newDraftId, sanitiseDraft } from '../../../lib/admin/draft-store';
import { PUB_PREFIX } from '../../../lib/admin/blocks';
import {
  markdownToBlocks,
  parseFrontmatter,
  splitFrontmatter,
  setDraftFlag,
  type ArticleFront,
} from '../../../lib/admin/parse-markdown';
import {
  getFileText,
  createBlobFromText,
  commitFiles,
  headSha,
  GitHubError,
  type GitHubConfig,
  type TreeEntry,
} from '../../../lib/admin/github';

const BRANCH = 'main';
const DRAFT_TTL_SECONDS = 60 * 60 * 24 * 90;
/** The URL shape a slug can take; also the guard against a traversal path. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

const ERRORI = {
  archivio: 'Non riesco a leggere l’archivio in questo momento. Riprova fra poco.',
  richiesta: 'Richiesta non valida.',
  ignoto: 'Questo articolo non esiste.',
  nonConfigurato:
    'Questa funzione non è ancora attiva su questo sito. Scrivi a Leo — non è un problema tuo.',
} as const;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const fail = (errore: string, status: number) => json({ ok: false, errore }, status);

function config(): GitHubConfig | null {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  return { token: GITHUB_TOKEN, repo: GITHUB_REPO, branch: BRANCH };
}

/** Whoever is logged in, attributed on the commit (public log → noreply address). */
function author(name: string | undefined, email: string) {
  return { name: name ?? 'Vidapiena', email: `${email.split('@')[0]}@users.noreply.github.com` };
}

export const POST: APIRoute = async (context) => {
  const kv = asListable(getKV());
  if (!kv) return fail(ERRORI.archivio, 503);

  const admin = context.locals.admin;
  const email = admin?.email ?? '';

  let body: { azione?: unknown; slug?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return fail(ERRORI.richiesta, 400);
  }

  const azione = typeof body.azione === 'string' ? body.azione : '';
  const slug = typeof body.slug === 'string' ? body.slug : '';
  if (!SLUG.test(slug)) return fail(ERRORI.richiesta, 400);

  /* --------------------------------------------------------- apri-modifica */
  if (azione === 'apri-modifica') {
    // Reuse an existing edit-draft for this slug rather than overwrite it: the
    // client may have unsaved changes in one, and re-seeding would discard them.
    // One `list` (a read) — writes are the scarce resource, not reads.
    try {
      const { keys } = await kv.list({ prefix: 'draft:', limit: 1000 });
      const gia = keys.find(
        (k) =>
          k.name.endsWith(':doc') &&
          k.metadata?.slug === slug &&
          (k.metadata?.owner ?? '').toLowerCase() === email.toLowerCase(),
      );
      if (gia) return json({ ok: true, id: gia.name.slice('draft:'.length, -':doc'.length) });
    } catch {
      return fail(ERRORI.archivio, 503);
    }

    // Prefer the raw body the content collection already holds; fall back to
    // reading the committed file only if it is not to hand at runtime.
    const entry = (await getCollection('blog', ({ data }) => data.locale === 'it')).find(
      (e) => e.id.replace(/^it\//, '') === slug,
    );

    let markdown: string;
    let front: ArticleFront;
    if (entry && typeof entry.body === 'string') {
      markdown = entry.body;
      front = {
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date.toISOString().slice(0, 10),
        cover: entry.data.cover ?? '',
        updated: entry.data.updated ? entry.data.updated.toISOString().slice(0, 10) : '',
        relatedTour: entry.data.relatedTour ?? '',
        draft: entry.data.draft,
      };
    } else {
      const cfg = config();
      if (!cfg) return fail(ERRORI.nonConfigurato, 503);
      let file: string | null;
      try {
        file = await getFileText(cfg, `src/content/blog/it/${slug}.md`);
      } catch (err) {
        if (err instanceof GitHubError) return fail(err.italiano, 502);
        throw err;
      }
      const split = file ? splitFrontmatter(file) : null;
      if (!split) return fail(ERRORI.ignoto, 404);
      markdown = split.body;
      front = parseFrontmatter(split.frontmatter);
    }

    // Build the draft through the same sanitiser the editor's saves go through, so
    // a re-opened article is shaped exactly like one written from scratch.
    const doc = sanitiseDraft(
      {
        title: front.title,
        description: front.description,
        date: front.date,
        coverPhotoId: front.cover ? `${PUB_PREFIX}${front.cover}` : '',
        relatedTour: front.relatedTour,
        blocks: markdownToBlocks(markdown),
        publishedSlug: slug,
      },
      email,
    );
    if (!doc) return fail(ERRORI.ignoto, 500);

    const id = newDraftId();
    const metadata: DraftMetadata = {
      title: doc.title.slice(0, 120),
      updatedAt: doc.updatedAt,
      owner: email,
      slug,
    };
    try {
      await kv.put(draftKey(id), JSON.stringify(doc), {
        expirationTtl: DRAFT_TTL_SECONDS,
        metadata,
      });
    } catch {
      return fail(ERRORI.archivio, 503);
    }
    return json({ ok: true, id });
  }

  /* --------------------------------------------------- ritira / ripristina */
  if (azione === 'ritira' || azione === 'ripristina') {
    const cfg = config();
    if (!cfg) return fail(ERRORI.nonConfigurato, 503);
    const offline = azione === 'ritira';

    const itPath = `src/content/blog/it/${slug}.md`;
    const enPath = `src/content/blog/en/${slug}.md`;

    try {
      const [itFile, enFile] = await Promise.all([
        getFileText(cfg, itPath),
        getFileText(cfg, enPath),
      ]);
      if (!itFile) return fail(ERRORI.ignoto, 404);

      const entries: TreeEntry[] = [
        { path: itPath, sha: await createBlobFromText(cfg, setDraftFlag(itFile, offline)) },
      ];
      // The English twin should always exist, but a missing one must not block
      // taking the Italian article offline.
      if (enFile) {
        entries.push({ path: enPath, sha: await createBlobFromText(cfg, setDraftFlag(enFile, offline)) });
      }

      const parent = await headSha(cfg);
      const commit = await commitFiles(
        cfg,
        entries,
        `${offline ? 'Togli dal sito' : 'Rimetti online'}: ${slug}`,
        author(admin?.name, email),
        parent,
      );
      return json({ ok: true, commit: commit.sha });
    } catch (err) {
      if (err instanceof GitHubError) return fail(err.italiano, 502);
      throw err;
    }
  }

  return fail(ERRORI.richiesta, 400);
};
