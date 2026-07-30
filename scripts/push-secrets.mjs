/**
 * Pushes the back-office secrets from .dev.vars to the Cloudflare Worker.
 *
 *   node scripts/push-secrets.mjs [--dry-run]
 *
 * Why this exists: the alternative is copying a ~300-character JSON array and a
 * 44-character key out of terminal scrollback and pasting each into an
 * interactive `wrangler secret put` prompt that echoes nothing. Every failure
 * mode of that paste — a truncation, an inherited pair of quotes, a stray
 * newline — produces a Worker that looks deployed and refuses every login. And
 * it is not a one-off: rotating a passphrase is the documented way to revoke a
 * session, so this paste happens again every time someone loses a phone.
 *
 * .dev.vars is git-ignored and is already the sanctioned home for these values,
 * so it is the natural source of truth. Nothing here prints a secret.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_VARS = path.join(REPO, '.dev.vars');
const dryRun = process.argv.includes('--dry-run');

/** Same shape check the Worker applies in src/lib/admin/session.ts. */
const HASH_SHAPE = /^pbkdf2\$\d{1,7}\$[A-Za-z0-9+/]{16,}={0,2}\$[A-Za-z0-9+/]{40,}={0,2}$/;
/** Must match MIN_SECRET_BYTES in src/lib/admin/crypto.ts. */
const MIN_SECRET_BYTES = 32;

function die(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(DEV_VARS, 'utf8');
} catch {
  die(
    `No .dev.vars found at ${DEV_VARS}\n\n` +
      `  Generate credentials first, then paste the ".dev.vars" block from its\n` +
      `  output into that file:\n\n` +
      `    npm run admin:credentials -- "email@esempio.it" "Nome" "altra@esempio.it" "Altro"`,
  );
}

/** Tolerates single quotes, double quotes or none — all three appear in the wild. */
function readVar(name) {
  const m = raw.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, 'm'));
  if (!m) return null;
  let v = m[1].trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1);
  }
  return v;
}

const adminUsers = readVar('ADMIN_USERS');
const sessionSecret = readVar('SESSION_SECRET');

if (!adminUsers) die('.dev.vars has no ADMIN_USERS line.');
if (!sessionSecret) die('.dev.vars has no SESSION_SECRET line.');

// Validate before pushing, not after. A secret that fails these checks produces a
// Worker that answers every login with "email o password non corretti" — and the
// person hitting that wall is a non-technical client in another country.
let users;
try {
  users = JSON.parse(adminUsers);
} catch (e) {
  die(`ADMIN_USERS is not valid JSON (${e.message}).\nA truncated paste is the usual cause.`);
}
if (!Array.isArray(users) || users.length === 0) die('ADMIN_USERS must be a non-empty JSON array.');

users.forEach((u, i) => {
  if (typeof u?.email !== 'string' || !u.email) die(`Account ${i} has no email.`);
  if (typeof u?.name !== 'string' || !u.name) die(`Account ${i} (${u.email}) has no name.`);
  if (typeof u?.hash !== 'string' || !HASH_SHAPE.test(u.hash)) {
    die(`Account ${i} (${u.email}) has a malformed hash — the value was mangled in transit.`);
  }
});

if (sessionSecret.length < MIN_SECRET_BYTES) {
  die(
    `SESSION_SECRET is only ${sessionSecret.length} characters; the Worker requires at least ` +
      `${MIN_SECRET_BYTES}.\nA short key is a silent downgrade, so it is rejected here.`,
  );
}

console.log(`\nFound in .dev.vars:`);
users.forEach((u, i) => console.log(`  [${i}] ${u.email} — ${u.name}`));
console.log(`  SESSION_SECRET: ${sessionSecret.length} characters ✓\n`);

if (dryRun) {
  console.log('--dry-run: validated only, nothing sent to Cloudflare.\n');
  process.exit(0);
}

/** Piped on stdin so the value never appears in a command line or shell history. */
function putSecret(name, value) {
  process.stdout.write(`Pushing ${name}… `);
  const r = spawnSync('npx', ['wrangler', 'secret', 'put', name], {
    input: value,
    stdio: ['pipe', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) die(`wrangler exited with code ${r.status} while setting ${name}.`);
  console.log('ok');
}

putSecret('ADMIN_USERS', adminUsers);
putSecret('SESSION_SECRET', sessionSecret);

console.log(`
Both secrets are live — they take effect immediately, no redeploy needed.

Verify with:
  curl -sI -H "Sec-Fetch-Mode: navigate" -H "Accept: text/html" <your-site>/admin

  location: /admin/entra                        ✓ configured
  location: /admin/entra?errore=configurazione   ✗ not picked up
`);
