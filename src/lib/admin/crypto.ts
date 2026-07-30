/**
 * Password verification and session-token signing for the back office.
 *
 * Web Crypto only — no Node built-ins. This runs on Cloudflare's workerd, where
 * native modules (bcrypt, argon2) do not exist and `node:crypto` is partial.
 *
 * On the iteration count — this is a hard platform constraint, not a preference.
 * The Workers *free* plan allows **10 ms of active CPU per invocation**, and
 * crypto.subtle work counts against it (only network I/O is excluded). Measured
 * cost of one PBKDF2-SHA-256 derive: 100,000 iterations ≈ 19 ms, 50,000 ≈ 9 ms,
 * 20,000 ≈ 3.7 ms. So the obvious "use workerd's 100,000 cap" would exceed the
 * whole request budget and fail the login with error 1102.
 *
 * 20,000 is safe and, more importantly, sufficient — because the strength here
 * comes from entropy, not hash cost. scripts/admin-credentials.mjs generates a
 * ~62-bit passphrase and Francesco never invents his own, so even a cheap KDF
 * leaves an offline attacker ~2^62 guesses. 62 bits at 20k iterations is far
 * stronger than 100k iterations protecting a password someone chose themselves.
 */

/** Used when generating a new hash. Kept well inside the 10 ms free-plan budget. */
const PBKDF2_ITERATIONS = 20_000;
/**
 * Verification accepts any count up to workerd's hard ceiling, so a hash minted
 * with a different (e.g. older, higher) count still authenticates instead of
 * silently reading as a wrong password. Anything above this throws in workerd.
 */
const PBKDF2_MAX_VERIFY_ITERATIONS = 100_000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

const encoder = new TextEncoder();

/** `pbkdf2$<iterations>$<salt-b64>$<hash-b64>` */
export type PasswordHash = string;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Compares two byte arrays in time independent of where they first differ, so a
 * remote attacker cannot learn a prefix of the expected value from response timing.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** Used by scripts/admin-credentials.mjs to mint the value stored in the secret. */
export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Returns false rather than throwing for every malformed-input case: a corrupt
 * stored hash must read as "wrong password", never as a 500 that reveals the
 * credential store is broken.
 */
export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = Number.parseInt(parts[1]!, 10);
  if (
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > PBKDF2_MAX_VERIFY_ITERATIONS
  ) {
    return false;
  }

  try {
    const salt = fromBase64(parts[2]!);
    const expected = fromBase64(parts[3]!);
    const actual = await pbkdf2(password, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- session token

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return fromBase64(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/**
 * A self-contained signed token, deliberately not a KV session record: the free
 * plan allows only 1,000 KV writes/day, and touching KV on every request would be
 * the first ceiling this project hits.
 */
export async function signToken(payload: object, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyToken<T>(token: string, secret: string): Promise<T | null> {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  try {
    const key = await hmacKey(secret);
    // Verify the signature before parsing the payload — never let unauthenticated
    // bytes reach JSON.parse or any downstream logic.
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature) as BufferSource,
      encoder.encode(body),
    );
    if (!ok) return null;
    return JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as T;
  } catch {
    return null;
  }
}
