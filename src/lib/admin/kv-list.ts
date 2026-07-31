/**
 * The listing half of the KV binding.
 *
 * Kept separate from `KVLike` in rate-limit.ts because only the editor needs it:
 * the login path deliberately touches nothing it does not have to, and adding
 * `list` there would let a future change list keys on an unauthenticated route.
 *
 * `list` is a *read* operation. That matters here — the free plan's scarce
 * resource is the 1,000 daily **writes**, and reads are effectively unlimited at
 * this traffic. So the article list is built by listing keys and reading the
 * metadata each `put` already attached, rather than by maintaining a separate
 * index key that would cost a write on every save.
 */

export interface DraftMetadata {
  title: string;
  updatedAt: number;
  owner: string;
  /** Present once published — the live slug, so the list can say "online". */
  slug?: string;
}

export interface KVListLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; metadata?: DraftMetadata },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; metadata?: DraftMetadata }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

/**
 * Narrows the binding, or returns null.
 *
 * Same reasoning as `getKV`: `worker-configuration.d.ts` promises the binding
 * exists, but that is a statement about the config file, not about the runtime a
 * request actually landed in.
 */
export function asListable(kv: unknown): KVListLike | null {
  const c = kv as KVListLike | null;
  return c && typeof c.list === 'function' && typeof c.get === 'function' ? c : null;
}
