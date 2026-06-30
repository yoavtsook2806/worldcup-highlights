import "./style.css";
import type { Game } from "./model";
import { CACHE_TTL_MS, WORLDCUP_LIST_URL } from "./kan/config";
import {
  clearKanCache,
  fetchKanPage,
  readJsonCache,
  writeJsonCache,
} from "./kan/fetch";
import { extractGameDate, parseGameList } from "./kan/parse";
import { renderError, renderGames, renderLoading } from "./ui/cards";

const RESULTS_KEY = "games-with-highlights";

/** Run async `fn` over `items` with at most `limit` in flight at once. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Enrich each game with its date (used to group highlights by day). The VOD
 * list is already filtered to real, published highlights, so we never drop a
 * game here: if its page can't be read, we just keep it without a date (it
 * lands in the "unknown date" bucket rather than disappearing).
 */
async function resolveGames(games: Game[], fresh: boolean): Promise<Game[]> {
  return mapLimit(games, 8, async (game): Promise<Game> => {
    try {
      // Don't store the big game-page HTML — only the small result list below.
      const html = await fetchKanPage(game.url, {
        useCache: !fresh,
        store: false,
      });
      return { ...game, date: extractGameDate(html) };
    } catch {
      return game;
    }
  });
}

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <header class="topbar">
    <h1 class="topbar__title">תקצירי גביע העולם ⚽️</h1>
    <p class="topbar__subtitle">בלי תוצאות — שתוכלו לצפות בלי לדעת איך זה נגמר</p>
  </header>
  <main id="content" class="content"></main>
  <footer class="footer">המקור: kan.org.il · הדף סורק את האתר בזמן אמת</footer>
`;

const content = document.querySelector<HTMLDivElement>("#content")!;

let lastLoadedAt = 0;
let inFlight = false;

async function load(
  { fresh = false, silent = false }: { fresh?: boolean; silent?: boolean } = {},
): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  // A silent refresh (e.g. on resume from background) keeps the current cards
  // on screen until fresh data is ready, so there's no loading flash.
  if (!silent) renderLoading(content);
  if (fresh) clearKanCache();
  try {
    // Fast path: reuse the cached, already-filtered list.
    if (!fresh) {
      const cached = readJsonCache<Game[]>(RESULTS_KEY);
      if (cached) {
        renderGames(content, cached);
        lastLoadedAt = Date.now();
        return;
      }
    }
    const html = await fetchKanPage(WORLDCUP_LIST_URL, { useCache: !fresh });
    const games = parseGameList(html);
    const real = await resolveGames(games, fresh);
    writeJsonCache(RESULTS_KEY, real);
    renderGames(content, real);
    lastLoadedAt = Date.now();
  } catch (err) {
    // On a silent refresh, leave the existing cards in place rather than
    // replacing good content with an error we couldn't recover from.
    if (!silent) renderError(content, err instanceof Error ? err.message : String(err));
  } finally {
    inFlight = false;
  }
}

// Runtime scan on page load.
void load();

// Refresh when the app is brought back to the foreground (e.g. an iOS
// Home Screen app reopened from background). iOS often resumes the frozen
// page instead of reloading it, so without this the games list would stay
// stale. We only refetch once the data is older than the cache TTL, so quick
// app-switches don't trigger needless network calls.
function refreshIfStale(): void {
  if (document.visibilityState !== "visible") return;
  if (Date.now() - lastLoadedAt < CACHE_TTL_MS) return;
  void load({ silent: true });
}

document.addEventListener("visibilitychange", refreshIfStale);
// `pageshow` covers restores from the back/forward cache, where
// `visibilitychange` may not fire.
window.addEventListener("pageshow", refreshIfStale);
