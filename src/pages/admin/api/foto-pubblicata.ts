/**
 * Serves a photo that is already committed to the repo, for the editor and the
 * preview to display when an article is opened for editing.
 *
 * The KV photo endpoint (`/admin/api/foto`) only knows uploads staged for an
 * unpublished draft. A photo on a live article lives in git at
 * `src/assets/photos/<key>.jpg` and has no KV entry — so a `foto` block carrying
 * the `pub:<key>` sentinel is rendered from here instead. The bytes are read
 * straight through GitHub's raw media type (no base64 decode — the 10 ms CPU
 * budget does not allow decoding a photo per request).
 *
 * ⚠️ `prerender = false` is load-bearing (see scrivi.astro). Auth is enforced by
 * src/middleware.ts, which denies `/admin/api/*` with a JSON 401.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { GITHUB_TOKEN, GITHUB_REPO } from 'astro:env/server';
import { getFileBytes, GitHubError, type GitHubConfig } from '../../../lib/admin/github';

/** Same shape as a committed photo key — the guard against a path-traversal `key`. */
const KEY = /^[a-z0-9][a-z0-9-]*$/;

function config(): GitHubConfig | null {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  return { token: GITHUB_TOKEN, repo: GITHUB_REPO, branch: 'main' };
}

export const GET: APIRoute = async (context) => {
  const key = context.url.searchParams.get('key') ?? '';
  if (!KEY.test(key)) return new Response('Chiave non valida', { status: 400 });

  const cfg = config();
  if (!cfg) return new Response('Pubblicazione non configurata', { status: 503 });

  try {
    const bytes = await getFileBytes(cfg, `src/assets/photos/${key}.jpg`);
    if (!bytes) return new Response('Foto non trovata', { status: 404 });
    return new Response(bytes, {
      headers: {
        'content-type': 'image/jpeg',
        // The bytes under a given key never change. Cache them so re-opening an
        // article does not re-pull every photo over mobile data — private, since
        // this sits behind the admin session. Setting cache-control here is what
        // opts out of the middleware's blanket `no-store`.
        'cache-control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    if (err instanceof GitHubError) return new Response(err.italiano, { status: 502 });
    throw err;
  }
};
