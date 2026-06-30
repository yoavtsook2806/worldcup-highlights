import type { Game } from "../model";
import { KAN_ORIGIN } from "./config";
import { codeFromName } from "./slug";

/**
 * Matches a highlight card in the /wc/wc-vod/ listing, e.g.
 *
 *   <a class="news-card unstyled-link"
 *      href="https://www.kan.org.il/content/worldcup/games/game75/s1/1067489/"
 *      aria-label="תקציר | הולנד - מרוקו">
 *
 * Every published highlight is a card linking to its `/s1/<id>/` section, with
 * the two teams in the aria-label. We match ONLY these cards: group/bracket
 * navigation cards link to the bare `/games/<slug>/` page (no `/s1/`) and are
 * skipped — so the result is already spoiler-free (names only, no score) and
 * pre-filtered to games that actually happened.
 *
 * `[^>]` matches newlines, so this tolerates the attributes being split across
 * lines as Kan serves them.
 */
const HIGHLIGHT_CARD_RE =
  /<a\b[^>]*class="news-card[^"]*"[^>]*href="[^"]*\/content\/worldcup\/games\/([a-z0-9]+)\/s1\/(\d+)\/"[^>]*aria-label="([^"]*)"/gi;

/** Decode HTML entities (e.g. `&#x27;` -> `'`) using the DOM. */
function decodeEntities(s: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

/**
 * Pull the two teams out of a highlight card's aria-label, which looks like
 * "תקציר | הולנד - מרוקו" or "תקציר | האיטי נגד סקוטלנד" (separator is either
 * " - " or " נגד "). Each name is mapped to its FIFA code so we can show the
 * flag/canonical name; an unrecognised name is kept as-is so it still displays.
 */
function teamsFromLabel(label: string): [string, string] | null {
  const decoded = decodeEntities(label);
  const body = decoded.includes("|")
    ? decoded.slice(decoded.indexOf("|") + 1)
    : decoded;
  const parts = body
    .split(/ נגד | - /)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length !== 2) return null;
  return [codeFromName(parts[0]) ?? parts[0], codeFromName(parts[1]) ?? parts[1]];
}

/**
 * Parse the VOD page HTML into a spoiler-free list of games. We read team names
 * only from the aria-label — never on-page text/thumbnails, which carry the
 * score — and a leaked score would defeat the purpose.
 */
export function parseGameList(html: string): Game[] {
  const bySlug = new Map<string, Game>();

  for (const m of html.matchAll(HIGHLIGHT_CARD_RE)) {
    const slug = m[1].toLowerCase();
    if (bySlug.has(slug)) continue;

    const teams = teamsFromLabel(m[3]);
    if (!teams) continue;

    bySlug.set(slug, {
      id: slug,
      slug,
      // The bare game page is what the player embeds + crops (see player.ts);
      // its crop is calibrated against this layout, not the /s1/ page.
      url: `${KAN_ORIGIN}/content/worldcup/games/${slug}/`,
      teams,
    });
  }

  return Array.from(bySlug.values());
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
