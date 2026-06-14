import "./style.css";
import type { Game } from "./model";
import { WORLDCUP_LIST_URL } from "./kan/config";
import {
  clearKanCache,
  fetchKanPage,
  readJsonCache,
  writeJsonCache,
} from "./kan/fetch";
import { pageHasHighlight, parseGameList } from "./kan/parse";
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

/** Keep only games whose page has a real, published highlight. */
async function keepGamesWithHighlights(
  games: Game[],
  fresh: boolean,
): Promise<Game[]> {
  const hasHighlight = await mapLimit(games, 8, async (game) => {
    try {
      // Don't store the big game-page HTML — only the small result list below.
      const html = await fetchKanPage(game.url, {
        useCache: !fresh,
        store: false,
      });
      return pageHasHighlight(html);
    } catch {
      return false;
    }
  });
  return games.filter((_, i) => hasHighlight[i]);
}

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <header class="topbar">
    <h1 class="topbar__title">תקצירי גביע העולם ⚽️</h1>
    <p class="topbar__subtitle">בלי תוצאות — שתוכלו לצפות בלי לדעת איך זה נגמר</p>
    <button id="refresh" class="topbar__refresh" type="button">↻ רענון</button>
  </header>
  <main id="content" class="content"></main>
  <footer class="footer">המקור: kan.org.il · הדף סורק את האתר בזמן אמת</footer>
`;

const content = document.querySelector<HTMLDivElement>("#content")!;
const refreshBtn = document.querySelector<HTMLButtonElement>("#refresh")!;

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
    const real = await keepGamesWithHighlights(games, fresh);
    writeJsonCache(RESULTS_KEY, real);
    renderGames(content, real);
  } catch (err) {
    renderError(content, err instanceof Error ? err.message : String(err));
  }
}

refreshBtn.addEventListener("click", () => void load({ fresh: true }));

// Runtime scan on page load.
void load();
