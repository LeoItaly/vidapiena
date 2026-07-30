/**
 * Mints back-office credentials. Run locally, never in CI.
 *
 *   node scripts/admin-credentials.mjs "francesco@vidapiena.com" "Francesco"
 *
 * Prints a generated passphrase plus the ADMIN_USERS / SESSION_SECRET values to
 * store as secrets. Nothing is written to disk — the passphrase exists only in
 * this terminal output, so copy it before closing the window.
 *
 * Why generated and not chosen: workerd caps PBKDF2 at 100,000 iterations, below
 * what a user-chosen password would need. The strength has to come from entropy
 * instead, so the passphrase is drawn here from a CSPRNG rather than invented by
 * someone who would pick "vidapiena2026".
 *
 * Word list is Italian and deliberately plain — Francesco has to read this off a
 * screen, type it once on a phone, and save it to his keychain.
 */

import { webcrypto as crypto } from 'node:crypto';

/**
 * Plain, short, accent-free Italian nouns — accent-free because he types this on a
 * phone keyboard, and unambiguous because he may read it off a screen out loud.
 *
 * The list length is not assumed anywhere: entropy is computed from the actual
 * unique count below, and the script refuses to run if it lands under the floor.
 */
const WORDS = [
  'acqua', 'albero', 'alba', 'ancora', 'anello', 'arancia', 'arco', 'argento',
  'aria', 'asse', 'balcone', 'banco', 'barca', 'bosco', 'braccio', 'bronzo',
  'burro', 'cadenza', 'calce', 'calma', 'campo', 'canale', 'candela', 'cane',
  'canto', 'capra', 'carbone', 'carta', 'casa', 'cascata', 'cassa', 'castello',
  'catena', 'cavallo', 'cena', 'cerchio', 'chiave', 'chiesa', 'cielo', 'ciliegia',
  'cima', 'cipolla', 'citta', 'collina', 'colonna', 'coltello', 'conchiglia', 'corda',
  'cornice', 'corona', 'corsa', 'cortile', 'costa', 'cotone', 'cucina', 'cuoio',
  'dado', 'dente', 'deserto', 'dito', 'domenica', 'duomo', 'edera', 'erba',
  'estate', 'faggio', 'falco', 'fango', 'farina', 'faro', 'fascia', 'fenice',
  'ferro', 'festa', 'fico', 'fienile', 'filo', 'fiore', 'fiume', 'foglia',
  'fondo', 'fonte', 'fontana', 'forma', 'formica', 'forno', 'fossa', 'fragola',
  'freccia', 'fresco', 'frutto', 'fuoco', 'gabbia', 'galleria', 'gamba', 'gancio',
  'gelso', 'gemma', 'gesso', 'ghiaccio', 'ghianda', 'giardino', 'ginepro', 'giornale',
  'giorno', 'giunco', 'gomma', 'gonna', 'grano', 'grotta', 'gruppo', 'guanto',
  'inchiostro', 'inverno', 'isola', 'lago', 'lampada', 'lana', 'lancia', 'latte',
  'lavagna', 'legno', 'lente', 'letto', 'libro', 'lima', 'limone', 'linea',
  'lino', 'luce', 'luna', 'lupo', 'macchia', 'maglia', 'mandorla', 'mano',
  'mantello', 'mappa', 'marmo', 'mare', 'martello', 'maschera', 'mattina', 'mattone',
  'medaglia', 'mela', 'melodia', 'mento', 'mercato', 'miele', 'miniera', 'monte',
  'mosaico', 'motore', 'muro', 'museo', 'musica', 'nastro', 'nave', 'nebbia',
  'neve', 'nido', 'nocciola', 'nodo', 'notte', 'nuvola', 'occhio', 'oliva',
  'olivo', 'ombra', 'onda', 'orma', 'orologio', 'orso', 'ortica', 'osso',
  'padella', 'paese', 'palazzo', 'palco', 'palma', 'pane', 'panno', 'parete',
  'passo', 'pasta', 'pelle', 'penna', 'pera', 'pesca', 'pesce', 'peso',
  'pettine', 'piano', 'pianta', 'piazza', 'piede', 'pietra', 'pino', 'pioggia',
  'piombo', 'pittura', 'polvere', 'ponte', 'porta', 'porto', 'pozzo', 'prato',
  'prugna', 'quaderno', 'quadro', 'quercia', 'radice', 'rame', 'ramo', 'rana',
  'rete', 'riga', 'riso', 'riva', 'roccia', 'rondine', 'rosa', 'rosmarino',
  'rotaia', 'ruota', 'sabbia', 'sacco', 'sale', 'salice', 'sapone', 'sasso',
  'scala', 'scatola', 'scoglio', 'sedia', 'sella', 'sentiero', 'sera', 'seta',
  'sole', 'sorgente', 'spalla', 'specchio', 'spiga', 'stagno', 'stanza', 'stella',
  'stagione', 'strada', 'tamburo', 'tappeto', 'tavolo', 'telaio', 'tenda', 'terra',
  'tetto', 'tavola', 'torre', 'traccia', 'treno', 'tronco', 'tulipano', 'uva',
  'valle', 'vaso', 'vela', 'veranda', 'vento', 'verde', 'vetro', 'vigna',
  'viola', 'volpe', 'zafferano', 'zattera', 'zolla', 'zucca',
];

const WORD_COUNT = 6;
const DIGIT_COUNT = 4;
/**
 * Floor for total passphrase entropy.
 *
 * Online guessing is already throttled to ~960 attempts/day (rate limit) behind
 * Turnstile, so this floor is not about online attacks — it is about the day the
 * ADMIN_USERS secret leaks. workerd caps PBKDF2 at 100k iterations, which a GPU
 * can push at roughly 1e5 guesses/second, so 60 bits buys ~300,000 years offline
 * while 31 bits would fall in an afternoon.
 */
const MIN_ENTROPY_BITS = 60;
/**
 * Must match src/lib/admin/crypto.ts. Bounded by the Workers *free* plan's 10 ms
 * active-CPU budget per request, which crypto.subtle work counts against: one
 * derive costs ~19 ms at 100,000 iterations (workerd's cap) and ~3.7 ms at 20,000.
 * The entropy floor above is what actually protects the credential.
 */
const PBKDF2_ITERATIONS = 20_000;

const UNIQUE_WORDS = [...new Set(WORDS)];
if (UNIQUE_WORDS.length !== WORDS.length) {
  // A duplicate silently shrinks the keyspace, so this is fatal rather than a warning.
  const seen = new Set();
  const dupes = WORDS.filter((w) => (seen.has(w) ? true : (seen.add(w), false)));
  console.error(`Word list has ${WORDS.length - UNIQUE_WORDS.length} duplicate(s): ${[...new Set(dupes)].join(', ')}`);
  process.exit(1);
}

const ENTROPY_BITS =
  WORD_COUNT * Math.log2(UNIQUE_WORDS.length) + DIGIT_COUNT * Math.log2(10);

if (ENTROPY_BITS < MIN_ENTROPY_BITS) {
  console.error(
    `Refusing to generate: ${ENTROPY_BITS.toFixed(1)} bits is below the ${MIN_ENTROPY_BITS}-bit floor.\n` +
      `Add words to the list or raise WORD_COUNT.`,
  );
  process.exit(1);
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

/**
 * Uniform selection from an arbitrary-sized list.
 *
 * Rejection sampling over a 32-bit draw, not `% length`: modulo would bias toward
 * the start of the list and quietly shrink the entropy this design leans on. The
 * 32-bit draw also keeps this correct for lists longer than 256 entries, which a
 * single-byte version would silently truncate.
 */
function pickUniform(list) {
  const limit = Math.floor(0x1_0000_0000 / list.length) * list.length;
  for (;;) {
    const [n] = crypto.getRandomValues(new Uint32Array(1));
    if (n < limit) return list[n % list.length];
  }
}

const DIGITS = [...'0123456789'];

function generatePassphrase() {
  const words = Array.from({ length: WORD_COUNT }, () => pickUniform(UNIQUE_WORDS));
  const digits = Array.from({ length: DIGIT_COUNT }, () => pickUniform(DIGITS)).join('');
  return `${words.join('-')}-${digits}`;
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

/**
 * Accepts any number of `<email> <name>` pairs and emits ONE ADMIN_USERS array
 * plus ONE SESSION_SECRET.
 *
 * Deliberately not one-user-per-run. Run twice and you get two secrets, of which
 * exactly one must be kept, and two single-element arrays that have to be
 * hand-merged into one — with the hashes containing `$` and the whole thing
 * pasted into an interactive prompt. That merge is the single most breakable step
 * in the setup, and its failure mode is silent: a malformed array means nobody
 * can log in, which reads as a wrong password.
 */
const args = process.argv.slice(2);

if (args.length < 2 || args.length % 2 !== 0) {
  console.error(
    'Usage: node scripts/admin-credentials.mjs <email> <name> [<email> <name> ...]\n' +
      '\n' +
      'Example — both accounts at once, which is what you want:\n' +
      '  node scripts/admin-credentials.mjs \\\n' +
      '    "vidapiena-riotours@outlook.com" "Francesco" \\\n' +
      '    "leonardo.rodo@outlook.it" "Leo"',
  );
  process.exit(1);
}

const people = [];
for (let i = 0; i < args.length; i += 2) {
  people.push({ email: args[i].trim(), name: args[i + 1].trim() });
}

// A typo'd address is a login nobody can use, and the error it produces is
// "email o password non corretti" — indistinguishable from a wrong password.
for (const { email } of people) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Not a valid email address: "${email}"`);
    process.exit(1);
  }
}

const seen = new Set();
for (const { email } of people) {
  const k = email.toLowerCase();
  // authenticate() takes the FIRST match, so a duplicate would silently create an
  // account whose password can never work.
  if (seen.has(k)) {
    console.error(`Duplicate email: "${email}" — each account needs its own address.`);
    process.exit(1);
  }
  seen.add(k);
}

const entropyBits = Math.round(ENTROPY_BITS);
const sessionSecret = toBase64(crypto.getRandomValues(new Uint8Array(32)));

const accounts = [];
for (const { email, name } of people) {
  const passphrase = generatePassphrase();
  accounts.push({ email, name, passphrase, hash: await hashPassword(passphrase) });
}

const adminUsers = JSON.stringify(
  accounts.map(({ email, name, hash }) => ({ email, name, hash })),
);

const handouts = accounts
  .map(
    ({ email, name, passphrase }) => `
──────────────────────────────────────────────────────────────
 GIVE THIS TO ${name.toUpperCase()} (and to nobody else)
──────────────────────────────────────────────────────────────

  Indirizzo:  ${email}
  Password:   ${passphrase}

  Link to send, with the address already filled in:
  https://<il-sito>/admin/entra?email=${encodeURIComponent(email)}

  (~${entropyBits} bits of entropy. Send it over a channel they already
   trust, and tell them to let the phone save it. Tell Francesco to
   open it in Safari, NOT inside WhatsApp.)`,
  )
  .join('\n');

console.log(`${handouts}

──────────────────────────────────────────────────────────────
 SECRETS — Cloudflare (production)
──────────────────────────────────────────────────────────────

  npx wrangler secret put ADMIN_USERS
  npx wrangler secret put SESSION_SECRET

  ADMIN_USERS:
${adminUsers}

  SESSION_SECRET:
${sessionSecret}

  Both accounts are already in the array above — paste it whole.
  Changing SESSION_SECRET signs everyone out.
  Rotating one person's hash signs out only that person.

──────────────────────────────────────────────────────────────
 .dev.vars — local only, git-ignored
──────────────────────────────────────────────────────────────

ADMIN_USERS='${adminUsers}'
SESSION_SECRET="${sessionSecret}"

──────────────────────────────────────────────────────────────
`);
