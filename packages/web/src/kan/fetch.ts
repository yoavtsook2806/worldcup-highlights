import {
  CACHE_PREFIX,
  CACHE_TTL_MS,
  PROXIES,
} from "./config";

interface CacheEntry {
  ts: number;
  html: string;
}

function readCache(url: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry.html;
  } catch {
    return null;
  }
}

function writeCache(url: string, html: string): void {
  try {
    const entry: CacheEntry = { ts: Date.now(), html };
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(entry));
  } catch {
    /* quota / disabled storage — ignore, caching is best-effort */
  }
}

/** Read a small JSON value from the cache (with TTL). */
export function readJsonCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { ts: number; value: T };
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry.value;
  } catch {
    return null;
  }
}

/** Write a small JSON value to the cache. */
export function writeJsonCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), value }));
  } catch {
    /* best-effort */
  }
}

/** Wipe all cached Kan pages (used by the Refresh button). */
export function clearKanCache(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

async function tryFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Fetch a Kan page as HTML.
 *
 * Strategy: serve from localStorage cache if fresh, else try a DIRECT
 * cross-origin fetch (the real path — only works from a browser on an allowed
 * IP), then fall back to the configured proxies (best-effort; usually blocked
 * by Cloudflare for Kan). Throws if every attempt fails.
 */
export async function fetchKanPage(
  url: string,
  { useCache = true, store = true }: { useCache?: boolean; store?: boolean } = {},
): Promise<string> {
  if (useCache) {
    const cached = readCache(url);
    if (cached) return cached;
  }

  // 1) Direct cross-origin fetch.
  let html = await tryFetch(url);

  // 2) Proxy fallbacks.
  if (!html) {
    for (const wrap of PROXIES) {
      html = await tryFetch(wrap(url));
      if (html) break;
    }
  }

  if (!html) {
    throw new Error(
      `Could not load ${url}. This is expected unless your browser is on an ` +
        `allowed (Israeli) IP and Cloudflare permits the cross-origin request.`,
    );
  }

  if (store) writeCache(url, html);
  return html;
}
