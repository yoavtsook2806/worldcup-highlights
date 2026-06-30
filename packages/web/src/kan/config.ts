/** Central configuration for talking to kan.org.il. */

export const KAN_ORIGIN = "https://www.kan.org.il";

/**
 * The World Cup VOD page we scan for available highlights.
 *
 * This is Kan's canonical, continuously-updated highlights listing. Each
 * published highlight appears as a card linking to its `/s1/<id>/` section with
 * the two teams in the card's aria-label — see parse.ts. (The older
 * `/content/worldcup/games/` index is no longer kept up to date.)
 */
export const WORLDCUP_LIST_URL = `${KAN_ORIGIN}/wc/wc-vod/`;

/**
 * Best-effort CORS proxies, tried in order if a direct browser fetch fails.
 *
 * NOTE: for kan.org.il specifically these will almost certainly NOT help — Kan
 * is behind a Cloudflare WAF rule (error 1020) + geo-restriction that blocks
 * datacenter IPs, which is exactly where these proxies run. They are kept only
 * as a generic fallback. The real path is a direct cross-origin fetch from a
 * browser on an allowed (Israeli) IP.
 *
 * Each entry is a function that wraps a target URL into a proxy URL.
 */
export const PROXIES: Array<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

/** How long fetched HTML stays fresh in localStorage (5 minutes). */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** localStorage key prefix for cached pages. */
export const CACHE_PREFIX = "kan-cache:";
