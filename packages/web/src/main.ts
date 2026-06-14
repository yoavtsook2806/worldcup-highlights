import "./style.css";
import type { Game } from "./model";
import { WORLDCUP_LIST_URL } from "./kan/config";
import {
  clearKanCache,
  fetchKanPage,
  readJsonCache,
  writeJsonCache,
} from "./kan/fetch";
import { extractGameDate, pageHasHighlight, parseGameList } from "./kan/parse";
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
 * Keep only games whose page has a real, published highlight, and enrich each
 * kept game with its date (for grouping). Future/projected fixtures are dropped.
 */
async function resolveGames(games: Game[], fresh: boolean): Promise<Game[]> {
  const resolved = await mapLimit(games, 8, async (game): Promise<Game | null> => {
    try {
      // Don't store the big game-page HTML — only the small result list below.
      const html = await fetchKanPage(game.url, {
        useCache: !fresh,
        store: false,
      });
      if (!pageHasHighlight(html)) return null;
      return { ...game, date: extractGameDate(html) };
    } catch {
      return null;
    }
  });
  return resolved.filter((g): g is Game => g !== null);
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

async function load({ fresh = false }: { fresh?: boolean } = {}): Promise<void> {
  renderLoading(content);
  if (fresh) clearKanCache();
  try {
    // Fast path: reuse the cached, already-filtered list.
    if (!fresh) {
      const cached = readJsonCache<Game[]>(RESULTS_KEY);
      if (cached) {
        renderGames(content, cached);
        return;
      }
    }
    const html = await fetchKanPage(WORLDCUP_LIST_URL, { useCache: !fresh });
    const games = parseGameList(html);
    const real = await resolveGames(games, fresh);
    writeJsonCache(RESULTS_KEY, real);
    renderGames(content, real);
  } catch (err) {
    renderError(content, err instanceof Error ? err.message : String(err));
  }
}

// Runtime scan on page load.
void load();
