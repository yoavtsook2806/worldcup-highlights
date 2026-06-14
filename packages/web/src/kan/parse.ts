import type { Game } from "../model";
import { KAN_ORIGIN } from "./config";
import { teamsFromSlug } from "./slug";

/**
 * Matches a Kan World Cup game link in the listing page source, e.g.
 *   https://www.kan.org.il/content/worldcup/games/ausvstur/
 *                                                  ^^^^^^^^ slug
 *
 * The listing links to the slug-only page (no /s1/<id>/ — those numeric ids
 * live on the per-game page). We scan the RAW HTML text rather than the DOM,
 * because Kan builds the actual <a> elements client-side; the links are present
 * in the served HTML as absolute URLs, which is what we match here.
 */
const GAME_URL_RE =
  /\/content\/worldcup\/games\/([a-z0-9]{2,5}vs[a-z0-9]{2,5})\//gi;

/**
 * Parse the World Cup list page HTML into a spoiler-free list of games.
 *
 * We rely ONLY on the game slug and derive team names from it. We never read
 * on-page text/thumbnails, because those tend to carry the score — and a leaked
 * score would defeat the purpose.
 */
export function parseGameList(html: string): Game[] {
  const bySlug = new Map<string, Game>();

  for (const m of html.matchAll(GAME_URL_RE)) {
    const slug = m[1].toLowerCase();
    if (bySlug.has(slug)) continue;

    const teams = teamsFromSlug(slug);
    if (!teams) continue;

    bySlug.set(slug, {
      id: slug,
      slug,
      url: `${KAN_ORIGIN}/content/worldcup/games/${slug}/`,
      teams,
    });
  }

  return Array.from(bySlug.values());
}

/**
 * Does a game page actually have a published highlight (i.e. the game really
 * happened), as opposed to a future/projected fixture that only has a page?
 *
 * A real highlight page references the VOD stream via Kan's Redge player
 * (`type=MOVIE`) and links to its `/s1/<id>` highlight section. Future fixtures
 * have neither.
 */
export function pageHasHighlight(html: string): boolean {
  if (/[?&]type=MOVIE\b/i.test(html)) return true;
  if (/\/content\/worldcup\/games\/[a-z0-9]+vs[a-z0-9]+\/s\d+\/\d+/i.test(html)) {
    return true;
  }
  return false;
}

/**
 * Extract the game's date from its page, used to group highlights by day.
 * Tries structured-data / meta dates in order of preference (kickoff first,
 * then publish dates). Returns an ISO string, or undefined if none found.
 */
export function extractGameDate(html: string): string | undefined {
  const patterns = [
    // Kan stores the kickoff time on the game widget — this is the game's date.
    /data-kick-off-time=["']([^"']+)["']/i,
    /data-target=["'](\d{4}-\d{2}-\d{2}T[^"']+)["']/i,
    // Fallbacks (structured data) in case the widget markup changes.
    /"startDate"\s*:\s*"([^"]+)"/i,
    /"uploadDate"\s*:\s*"([^"]+)"/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      const t = Date.parse(m[1]);
      if (!Number.isNaN(t)) return new Date(t).toISOString();
    }
  }
  return undefined;
}
