/**
 * The boundary between Astro and the Cloudflare runtime.
 *
 * Everything untyped or platform-specific is narrowed here once, so the rest of
 * the back office is plain typed TypeScript with no `any` and no casts scattered
 * through page files.
 */

import type { APIContext } from 'astro';
// `Astro.locals.runtime.env` was removed in Astro v6 — accessing it throws at
// runtime with an explicit message. This is the supported replacement.
import { env } from 'cloudflare:workers';
import type { KVLike, RateLimiterLike } from './rate-limit';

/**
 * Cloudflare KV binding declared in wrangler.jsonc.
 *
 * Structurally checked rather than trusted: the binding is absent when running
 * outside the Workers runtime, so every caller must handle null.
 */
export function getKV(): KVLike | null {
  // Typed as always-present by worker-configuration.d.ts, but that is a compile-time
  // promise about the config, not a runtime guarantee — a namespace that failed to
  // provision would still arrive undefined here.
  const binding = env?.SESSION as KVLike | undefined;
  return binding && typeof binding.get === 'function' ? binding : null;
}

/**
 * Cloudflare Rate Limiting binding declared in wrangler.jsonc.
 *
 * Narrowed the same way as the KV binding, and for the same reason: the generated
 * types promise it exists because the config file says so, which is not a
 * statement about the runtime a given request landed in. Callers handle null by
 * letting the request through and logging — see checkLoginRate.
 */
export function getLoginLimiter(): RateLimiterLike | null {
  const binding = env?.LOGIN_RL as RateLimiterLike | undefined;
  return binding && typeof binding.limit === 'function' ? binding : null;
}

/**
 * Client IP for throttling.
 *
 * `cf-connecting-ip` is set by Cloudflare's edge and cannot be spoofed by the
 * client on a real deployment. `x-forwarded-for` is only consulted as a local-dev
 * convenience and is deliberately last — trusting it in production would let an
 * attacker reset their own rate-limit bucket by rotating a header.
 */
export function getClientIp(context: APIContext): string {
  const headers = context.request.headers;
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * Whether to mark cookies `Secure`. On plain-HTTP localhost the browser drops
 * Secure cookies silently, which looks exactly like a broken login.
 */
export function isSecureRequest(context: APIContext): boolean {
  return new URL(context.request.url).protocol === 'https:';
}
