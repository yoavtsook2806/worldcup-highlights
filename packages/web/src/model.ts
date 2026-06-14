/**
 * A single World Cup game/highlight as shown on the home page.
 *
 * IMPORTANT: this type DELIBERATELY has no `score` / `result` field. The whole
 * point of the app is to let a viewer watch a highlight without learning how the
 * game ended, so a score must never be able to flow into the UI. The parser is
 * responsible for dropping any score-bearing text it encounters.
 */
export interface Game {
  /** Numeric content id from the Kan URL, e.g. "1053659". */
  id: string;
  /** Absolute Kan game URL. */
  url: string;
  /** URL slug, e.g. "ausvstur". */
  slug: string;
  /** Team display names/codes derived from the slug — NO score. */
  teams: [string, string];
  /** Optional kickoff/publish date if present in the markup (never a score). */
  date?: string;
}
