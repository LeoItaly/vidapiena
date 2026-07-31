/**
 * Putting an article into the repository, as exactly one commit.
 *
 * ## Why one commit and not several
 *
 * Every push to `main` triggers a 6–7 minute build. The Contents API writes one
 * file per call, so an article with a cover and four inline photos would be
 * seven commits, seven builds, and six intermediate states of the live site —
 * including states where the Italian article exists and its mandatory English
 * twin does not, which is an hreflang link to a 404.
 *
 * The Git Data API builds the whole tree first and moves the branch ref once:
 * blobs → tree → commit → ref. Nothing is visible until the last call, and the
 * last call is atomic.
 *
 * ## Why the CPU budget shapes this file
 *
 * The free plan allows 10 ms of *active CPU* per request. Network waiting does
 * not count, which is what makes a multi-call GitHub sequence affordable at all.
 * What does count is touching the photo bytes — so this module never decodes
 * them: KV already holds base64, GitHub's blob API accepts base64, and the two
 * are passed through as the same string. See `blobBody`.
 */

/** GitHub rejects requests without a User-Agent, with an unhelpful 403. */
const UA = 'vidapiena-backoffice';
const API = 'https://api.github.com';

export interface GitHubConfig {
  token: string;
  /** `owner/name` */
  repo: string;
  branch: string;
}

export class GitHubError extends Error {
  constructor(
    /** Italian, shown to Francesco verbatim. */
    readonly italiano: string,
    readonly status: number,
    cause?: string,
  ) {
    super(cause ?? italiano);
  }
}

/**
 * Maps a GitHub failure onto something the client can act on.
 *
 * The distinction that matters most is 401 vs 5xx: an expired token is a thing
 * only Leo can fix and Francesco must be told to stop retrying, whereas a 502 is
 * worth one more tap. Getting this wrong means he either gives up on a transient
 * failure or retries forever against a dead credential.
 */
function fail(status: number, detail: string): GitHubError {
  if (status === 401 || status === 403) {
    return new GitHubError(
      'Il collegamento con il sito è scaduto. Non è colpa tua e non serve riprovare: ' +
        'scrivi a Leo, si sistema in due minuti.',
      status,
      `github auth failed: ${detail}`,
    );
  }
  if (status === 409 || status === 422) {
    return new GitHubError(
      'Qualcun altro ha modificato il sito mentre pubblicavi. Riprova fra un minuto.',
      status,
      `github conflict: ${detail}`,
    );
  }
  return new GitHubError(
    'GitHub non risponde in questo momento. Il tuo articolo è salvo: riprova fra qualche minuto.',
    status,
    `github ${status}: ${detail}`,
  );
}

async function api<T>(
  cfg: GitHubConfig,
  path: string,
  init?: { method?: string; body?: string },
): Promise<T> {
  const res = await fetch(`${API}/repos/${cfg.repo}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      authorization: `Bearer ${cfg.token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': UA,
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
    },
    ...(init?.body ? { body: init.body } : {}),
  });

  if (!res.ok) {
    // Read at most a little: the body is diagnostic, and parsing a large error
    // page is CPU we do not have.
    const text = (await res.text().catch(() => '')).slice(0, 300);
    throw fail(res.status, text);
  }
  return (await res.json()) as T;
}

/**
 * Creates a blob from already-base64 content, without decoding it.
 *
 * The body is concatenated rather than built with JSON.stringify because the
 * only variable is base64 — an alphabet with no character JSON must escape — so
 * the result is valid JSON either way, and this avoids re-walking a ~550 KB
 * string inside a 10 ms budget. `assertBase64` is what makes that safe rather
 * than merely fast: it is the guarantee that nothing needing escaping can appear.
 */
function blobBody(base64: string): string {
  assertBase64(base64);
  return `{"content":"${base64}","encoding":"base64"}`;
}

function assertBase64(value: string): void {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new GitHubError(
      'Una delle foto è danneggiata. Toglila e ricaricala.',
      0,
      'blob content is not base64',
    );
  }
}

export async function createBlobFromBase64(cfg: GitHubConfig, base64: string): Promise<string> {
  const { sha } = await api<{ sha: string }>(cfg, '/git/blobs', {
    method: 'POST',
    body: blobBody(base64),
  });
  return sha;
}

export async function createBlobFromText(cfg: GitHubConfig, text: string): Promise<string> {
  const { sha } = await api<{ sha: string }>(cfg, '/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content: text, encoding: 'utf-8' }),
  });
  return sha;
}

/**
 * Reads a file from the repo with a caller-chosen Accept, so the raw bytes come
 * back directly rather than as base64 wrapped in JSON — decoding a photo's base64
 * would cost CPU this Worker does not have. Returns null on 404 (a not-yet-there
 * file is a normal answer here, not an error).
 */
async function contents(cfg: GitHubConfig, path: string, accept: string): Promise<Response | null> {
  const res = await fetch(
    `${API}/repos/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`,
    {
      headers: {
        authorization: `Bearer ${cfg.token}`,
        accept,
        'x-github-api-version': '2022-11-28',
        'user-agent': UA,
      },
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw fail(res.status, (await res.text().catch(() => '')).slice(0, 300));
  return res;
}

/** The UTF-8 text of a committed file, or null if it is not in the repo. */
export async function getFileText(cfg: GitHubConfig, path: string): Promise<string | null> {
  const res = await contents(cfg, path, 'application/vnd.github.raw+json');
  return res ? res.text() : null;
}

/** The raw bytes of a committed file (e.g. a photo), or null if it is not there. */
export async function getFileBytes(cfg: GitHubConfig, path: string): Promise<ArrayBuffer | null> {
  const res = await contents(cfg, path, 'application/vnd.github.raw');
  return res ? res.arrayBuffer() : null;
}

export interface TreeEntry {
  /** Repo-relative, forward slashes, no leading slash. */
  path: string;
  sha: string;
}

export interface CommitResult {
  sha: string;
  /** The branch head this commit was built on — what a revert goes back to. */
  parent: string;
}

export async function headSha(cfg: GitHubConfig): Promise<string> {
  const ref = await api<{ object: { sha: string } }>(
    cfg,
    `/git/ref/heads/${encodeURIComponent(cfg.branch)}`,
  );
  return ref.object.sha;
}

/**
 * tree → commit → ref, given blobs that already exist.
 *
 * `base_tree` is the current head's tree, so this is a patch: files not
 * mentioned are untouched. Without it the commit would contain *only* the new
 * files and the push would delete the entire site.
 *
 * The ref update is deliberately NOT forced. If someone (Leo, or a second
 * publish) moved the branch since `expectedParent` was read, GitHub rejects it
 * with a 422 and the caller re-reads and retries — rather than silently
 * discarding whatever the other push contained.
 */
export async function commitFiles(
  cfg: GitHubConfig,
  entries: TreeEntry[],
  message: string,
  author: { name: string; email: string },
  expectedParent: string,
): Promise<CommitResult> {
  const base = await api<{ commit: { sha: string; commit: { tree: { sha: string } } } }>(
    cfg,
    `/commits/${expectedParent}`,
  );

  const tree = await api<{ sha: string }>(cfg, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: base.commit.commit.tree.sha,
      tree: entries.map((e) => ({ path: e.path, mode: '100644', type: 'blob', sha: e.sha })),
    }),
  });

  const commit = await api<{ sha: string }>(cfg, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [expectedParent],
      author,
    }),
  });

  await api(cfg, `/git/refs/heads/${encodeURIComponent(cfg.branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return { sha: commit.sha, parent: expectedParent };
}

/**
 * Undo, as a new commit rather than a rewritten history.
 *
 * A force-push back to the parent would be invisible in the log and would break
 * anyone's clone. Restoring the parent's tree under a fresh commit reverts the
 * site with a full audit trail, and triggers exactly one rebuild.
 */
export async function revertTo(
  cfg: GitHubConfig,
  goodSha: string,
  message: string,
  author: { name: string; email: string },
): Promise<string> {
  const current = await headSha(cfg);
  const good = await api<{ commit: { commit: { tree: { sha: string } } } }>(
    cfg,
    `/commits/${goodSha}`,
  );

  const commit = await api<{ sha: string }>(cfg, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: good.commit.commit.tree.sha,
      parents: [current],
      author,
    }),
  });

  await api(cfg, `/git/refs/heads/${encodeURIComponent(cfg.branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return commit.sha;
}

export interface RunStatus {
  /** 'queued' | 'in_progress' | 'completed' */
  status: string;
  /** 'success' | 'failure' | 'cancelled' | null while running */
  conclusion: string | null;
  url: string;
  startedAt: string;
}

/**
 * The Actions run for a commit — the 6–7 minutes Francesco waits through.
 *
 * Matched by head SHA rather than "the most recent run", because a run started
 * by Leo pushing at the same moment would otherwise be reported as his.
 */
export async function runForCommit(
  cfg: GitHubConfig,
  sha: string,
): Promise<RunStatus | null> {
  const data = await api<{
    workflow_runs: {
      head_sha: string;
      status: string;
      conclusion: string | null;
      html_url: string;
      run_started_at: string;
    }[];
  }>(cfg, `/actions/runs?per_page=20&branch=${encodeURIComponent(cfg.branch)}`);

  const run = data.workflow_runs.find((r) => r.head_sha === sha);
  if (!run) return null;
  return {
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    startedAt: run.run_started_at,
  };
}

/**
 * How long the credential has left.
 *
 * A fine-grained PAT expires, and the failure mode without this is the worst one
 * available: Francesco taps Pubblica, nothing happens, and the only person who
 * could diagnose it is not looking. GitHub returns the expiry on any authenticated
 * response, so this costs one cheap call and no extra permission.
 */
export async function tokenExpiry(cfg: GitHubConfig): Promise<Date | null> {
  const res = await fetch(`${API}/repos/${cfg.repo}`, {
    headers: {
      authorization: `Bearer ${cfg.token}`,
      accept: 'application/vnd.github+json',
      'user-agent': UA,
    },
  });
  const header = res.headers.get('github-authentication-token-expiration');
  if (!header) return null;
  const when = new Date(header.replace(' UTC', 'Z').replace(' ', 'T'));
  return Number.isNaN(when.getTime()) ? null : when;
}
