/**
 * Derive team display names from a Kan game slug such as "ausvstur".
 *
 * The slug joins two team codes with "vs". Codes are usually 3 letters (FIFA
 * style: AUS, TUR, BRA) but we tolerate other lengths by splitting on "vs".
 */

/** FIFA-ish 3-letter code -> { name, flag } for nicer display. Extend freely. */
const TEAMS: Record<string, { name: string; flag: string }> = {
  aus: { name: "אוסטרליה", flag: "🇦🇺" },
  tur: { name: "טורקיה", flag: "🇹🇷" },
  bra: { name: "ברזיל", flag: "🇧🇷" },
  arg: { name: "ארגנטינה", flag: "🇦🇷" },
  fra: { name: "צרפת", flag: "🇫🇷" },
  ger: { name: "גרמניה", flag: "🇩🇪" },
  esp: { name: "ספרד", flag: "🇪🇸" },
  eng: { name: "אנגליה", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  por: { name: "פורטוגל", flag: "🇵🇹" },
  ned: { name: "הולנד", flag: "🇳🇱" },
  ita: { name: "איטליה", flag: "🇮🇹" },
  usa: { name: "ארה״ב", flag: "🇺🇸" },
  isr: { name: "ישראל", flag: "🇮🇱" },
  mar: { name: "מרוקו", flag: "🇲🇦" },
  qat: { name: "קטאר", flag: "🇶🇦" },
  sui: { name: "שווייץ", flag: "🇨🇭" },
  par: { name: "פרגוואי", flag: "🇵🇾" },
  hai: { name: "האיטי", flag: "🇭🇹" },
  sco: { name: "סקוטלנד", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  bel: { name: "בלגיה", flag: "🇧🇪" },
  cro: { name: "קרואטיה", flag: "🇭🇷" },
  mex: { name: "מקסיקו", flag: "🇲🇽" },
  jpn: { name: "יפן", flag: "🇯🇵" },
  kor: { name: "דרום קוריאה", flag: "🇰🇷" },
  uru: { name: "אורוגוואי", flag: "🇺🇾" },
  col: { name: "קולומביה", flag: "🇨🇴" },
  sen: { name: "סנגל", flag: "🇸🇳" },
  gha: { name: "גאנה", flag: "🇬🇭" },
  cmr: { name: "קמרון", flag: "🇨🇲" },
  pol: { name: "פולין", flag: "🇵🇱" },
  den: { name: "דנמרק", flag: "🇩🇰" },
  srb: { name: "סרביה", flag: "🇷🇸" },
  wal: { name: "ויילס", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  ecu: { name: "אקוודור", flag: "🇪🇨" },
  iri: { name: "איראן", flag: "🇮🇷" },
  ksa: { name: "ערב הסעודית", flag: "🇸🇦" },
  tun: { name: "תוניסיה", flag: "🇹🇳" },
  crc: { name: "קוסטה ריקה", flag: "🇨🇷" },
  can: { name: "קנדה", flag: "🇨🇦" },
  bih: { name: "בוסניה", flag: "🇧🇦" },
  rsa: { name: "דרום אפריקה", flag: "🇿🇦" },
  cze: { name: "צ׳כיה", flag: "🇨🇿" },
  uzb: { name: "אוזבקיסטן", flag: "🇺🇿" },
  pan: { name: "פנמה", flag: "🇵🇦" },
  cur: { name: "קוראסאו", flag: "🇨🇼" },
};

export interface TeamDisplay {
  code: string;
  name: string;
  flag: string;
}

export function teamFromCode(code: string): TeamDisplay {
  const key = code.toLowerCase();
  const entry = TEAMS[key];
  return {
    code: code.toUpperCase(),
    name: entry?.name ?? code.toUpperCase(),
    flag: entry?.flag ?? "🏳️",
  };
}

/**
 * Split a slug into its two team codes. Returns null if it doesn't look like a
 * "<a>vs<b>" slug.
 */
export function teamsFromSlug(slug: string): [string, string] | null {
  const parts = slug.toLowerCase().split("vs");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}
