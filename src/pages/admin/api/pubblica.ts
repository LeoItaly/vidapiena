/**
 * The publish loop.
 *
 * Split into phases the client drives, for two reasons that both come from the
 * platform rather than from taste:
 *
 * 1. **Translation is slow** (seconds, sometimes tens of seconds) while the
 *    commit is fast. Putting them in one request means one long-lived connection
 *    that a phone on Rio mobile data will drop half-way.
 * 2. **After the commit, closing the browser is safe.** The push has happened,
 *    GitHub Actions builds regardless, and the article goes live whether or not
 *    anyone is watching. So the only phase that must survive interruption is the
 *    one that already does. `stato` is reassurance, not machinery.
 *
 * The phases are stateless apart from KV: nothing is held in memory between
 * requests, so a retry at any point is safe and idempotent up to the commit.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { GITHUB_TOKEN, GITHUB_REPO } from 'astro:env/server';
import { env } from 'cloudflare:workers';
import { getCollection } from 'astro:content';
import { getKV } from '../../../lib/admin/runtime';
import {
  DRAFT_ID,
  getDraft,
  getPhotoIndex,
  putDraft,
  ownership,
} from '../../../lib/admin/draft-store';
import { getPhoto } from '../../../lib/admin/photo-store';
import { blocksToMarkdown, referencedPhotoIds } from '../../../lib/admin/blocks';
import { buildArticleFile } from '../../../lib/admin/frontmatter';
import { checkDraft, checkFile } from '../../../lib/admin/publish-check';
import { translateBlocks, workersAiTranslator, type WorkersAI } from '../../../lib/admin/translate';
import {
  commitFiles,
  createBlobFromBase64,
  createBlobFromText,
  headSha,
  revertTo,
  runForCommit,
  tokenExpiry,
  GitHubError,
  type GitHubConfig,
  type TreeEntry,
} from '../../../lib/admin/github';

const BRANCH = 'main';

const ERRORI = {
  archivio: 'Non riesco a leggere la bozza in questo momento. Riprova fra poco.',
  bozzaIgnota: 'Questa bozza non esiste più.',
  altrui: 'Questa bozza è di un altro account.',
  nonConfigurato:
    'La pubblicazione non è ancora attiva su questo sito. Scrivi a Leo — non è un problema del tuo articolo.',
  fase: 'Richiesta non valida.',
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

/** `blog-<slug>-01`, `-02`… — prefixed so it can never collide with the 46 curated keys. */
function photoKeyFor(slug: string, n: number): string {
  return `blog-${slug}-${String(n + 1).padStart(2, '0')}`;
}

export const POST: APIRoute = async (context) => {
  const kv = getKV();
  if (!kv) return fail(ERRORI.archivio, 503);

  const admin = context.locals.admin;
  const email = admin?.email ?? '';
  const cfg = config();

  let body: { id?: unknown; fase?: unknown; commit?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return fail(ERRORI.fase, 400);
  }

  const draftId = typeof body.id === 'string' ? body.id : '';
  const fase = typeof body.fase === 'string' ? body.fase : '';
  if (!DRAFT_ID.test(draftId)) return fail(ERRORI.bozzaIgnota, 400);

  const draft = await getDraft(kv, draftId);
  if (!draft) return fail(ERRORI.bozzaIgnota, 404);
  if (ownership(draft.owner, email) === 'altrui') return fail(ERRORI.altrui, 403);

  const index = await getPhotoIndex(kv, draftId);
  const fotoDisponibili = index?.ids ?? [];

  /* ---------------------------------------------------------------- controlla */
  // Validation only. Runs with no token configured, so he can see that his
  // article is in order even before publishing is switched on.
  if (fase === 'controlla') {
    const pubblicati = await getCollection('blog', ({ data }) => data.locale === 'it');
    const slugEsistenti = pubblicati.map((p) => p.id.replace(/^it\//, ''));
    const esito = checkDraft(draft, { fotoDisponibili, slugEsistenti });
    // `esito.ok` means "the article is valid"; the envelope's `ok` means "the
    // request succeeded". Spreading esito last would silently conflate them, so
    // the article's verdict is named explicitly.
    return json({
      ok: true,
      valido: esito.ok,
      errori: esito.errori,
      avvisi: esito.avvisi,
      slug: esito.slug,
      attivo: cfg !== null,
      foto: referencedPhotoIds(draft.blocks).length + (draft.coverPhotoId ? 1 : 0),
    });
  }

  if (!cfg) return fail(ERRORI.nonConfigurato, 503);

  /* ----------------------------------------------------------------- traduci */
  // The English twin. Slow (a model call per block), so it is its own phase and
  // its result is parked in KV — a dropped connection here costs the translation,
  // not the article.
  if (fase === 'traduci') {
    const ai = (env as unknown as { AI?: WorkersAI }).AI ?? null;
    const translate = workersAiTranslator(ai);
    const [title, description] = await Promise.all([
      translate(draft.title),
      translate(draft.description),
    ]);
    const blocks = await translateBlocks(draft.blocks, translate);
    await putDraft(kv, draftId, { ...draft, en: { title, description, blocks } });
    return json({ ok: true, tradotto: true, titoloEn: title });
  }

  /* ------------------------------------------------------------------ pubblica */
  if (fase === 'pubblica') {
    const pubblicati = await getCollection('blog', ({ data }) => data.locale === 'it');
    const slugEsistenti = pubblicati.map((p) => p.id.replace(/^it\//, ''));
    const esito = checkDraft(draft, { fotoDisponibili, slugEsistenti });
    // Re-validated here and not merely in `controlla`: the client controls the
    // order of these calls, and nothing invalid may reach the repository.
    if (!esito.ok) return json({ ok: false, errori: esito.errori }, 422);

    const slug = esito.slug;
    const en = draft.en;

    // Photo ids → their final `blog-<slug>-NN` keys, assigned once, now that the
    // slug is finally frozen.
    const usate = referencedPhotoIds(draft.blocks);
    const tutte = draft.coverPhotoId && !usate.includes(draft.coverPhotoId)
      ? [draft.coverPhotoId, ...usate]
      : usate;
    const chiavi = new Map<string, string>();
    tutte.forEach((id, i) => chiavi.set(id, photoKeyFor(slug, i)));

    const entries: TreeEntry[] = [];

    try {
      // One blob per photo, straight from the base64 already in KV — no decode,
      // no re-encode. Sequential so each request's CPU stays near zero.
      for (const [fotoId, chiave] of chiavi) {
        const photo = await getPhoto(kv, draftId, fotoId);
        if (!photo) return json({ ok: false, errori: ['Una foto non c’è più.'] }, 422);
        const sha = await createBlobFromBase64(cfg, photo.data);
        entries.push({ path: `src/assets/photos/${chiave}.jpg`, sha });
      }

      const resolve = (id: string) => chiavi.get(id) ?? null;
      const front = {
        title: draft.title,
        description: draft.description,
        date: new Date(draft.date),
        ...(draft.publishedSlug ? { updated: new Date() } : {}),
        cover: draft.coverPhotoId ? chiavi.get(draft.coverPhotoId) : undefined,
        draft: false,
      };

      const itFile = buildArticleFile(
        { ...front, locale: 'it' },
        blocksToMarkdown(draft.blocks, resolve),
      );
      // If translation was skipped or failed, the twin ships the Italian text.
      // The pair still resolves and hreflang stays valid — a missing file would
      // be a live link to a 404, which is strictly worse than untranslated prose.
      const enFile = buildArticleFile(
        {
          ...front,
          locale: 'en',
          title: en?.title || draft.title,
          description: en?.description || draft.description,
        },
        blocksToMarkdown(en?.blocks ?? draft.blocks, resolve),
      );

      const problemi = [
        ...checkFile(`blog/it/${slug}.md`, itFile),
        ...checkFile(`blog/en/${slug}.md`, enFile),
      ];
      if (problemi.length) return json({ ok: false, errori: problemi }, 422);

      entries.push({
        path: `src/content/blog/it/${slug}.md`,
        sha: await createBlobFromText(cfg, itFile),
      });
      entries.push({
        path: `src/content/blog/en/${slug}.md`,
        sha: await createBlobFromText(cfg, enFile),
      });

      const parent = await headSha(cfg);
      const commit = await commitFiles(
        cfg,
        entries,
        `${draft.publishedSlug ? 'Aggiorna' : 'Pubblica'}: ${draft.title}`,
        // Attributed to whoever actually wrote it — the reason there are two
        // accounts at all. `noreply` because the address is public in the log.
        { name: admin?.name ?? 'Vidapiena', email: `${email.split('@')[0]}@users.noreply.github.com` },
        parent,
      );

      // Record the freeze and the rollback point on the draft itself, so a
      // revert needs nothing but the draft id.
      await putDraft(kv, draftId, {
        ...draft,
        publishedSlug: slug,
        lastCommit: commit.sha,
        lastParent: commit.parent,
      });

      return json({ ok: true, slug, commit: commit.sha, parent: commit.parent, foto: chiavi.size });
    } catch (err) {
      if (err instanceof GitHubError) return json({ ok: false, errori: [err.italiano] }, 502);
      throw err;
    }
  }

  /* -------------------------------------------------------------------- stato */
  if (fase === 'stato') {
    const sha = typeof body.commit === 'string' ? body.commit : '';
    if (!/^[0-9a-f]{40}$/.test(sha)) return fail(ERRORI.fase, 400);
    try {
      const run = await runForCommit(cfg, sha);
      if (!run) return json({ ok: true, fase: 'in-coda' });
      if (run.status !== 'completed') return json({ ok: true, fase: 'in-corso', url: run.url });
      return json({
        ok: true,
        fase: run.conclusion === 'success' ? 'online' : 'fallito',
        conclusione: run.conclusion,
        url: run.url,
      });
    } catch (err) {
      // A polling failure is not a publish failure: the commit is already in.
      if (err instanceof GitHubError) return json({ ok: true, fase: 'sconosciuto' });
      throw err;
    }
  }

  /* ------------------------------------------------------------------ annulla */
  // One tap back to the state before this article. A new commit restoring the
  // previous tree, never a force-push: history stays readable and no clone breaks.
  if (fase === 'annulla') {
    const parent = draft.lastParent;
    if (!parent) return fail('Non c’è niente da annullare.', 400);
    try {
      const sha = await revertTo(
        cfg,
        parent,
        `Annulla: ${draft.title}`,
        { name: admin?.name ?? 'Vidapiena', email: `${email.split('@')[0]}@users.noreply.github.com` },
      );
      return json({ ok: true, commit: sha });
    } catch (err) {
      if (err instanceof GitHubError) return json({ ok: false, errori: [err.italiano] }, 502);
      throw err;
    }
  }

  return fail(ERRORI.fase, 400);
};

/**
 * Health of the publishing credential, for the dashboard.
 *
 * A fine-grained PAT expires, and without this the first anyone hears of it is
 * Francesco tapping Pubblica and nothing happening.
 */
export const GET: APIRoute = async () => {
  const cfg = config();
  if (!cfg) return json({ ok: true, attivo: false });
  try {
    const scade = await tokenExpiry(cfg);
    const giorni = scade ? Math.floor((scade.getTime() - Date.now()) / 86_400_000) : null;
    return json({ ok: true, attivo: true, scade: scade?.toISOString() ?? null, giorni });
  } catch {
    return json({ ok: true, attivo: true, scade: null, giorni: null });
  }
};
