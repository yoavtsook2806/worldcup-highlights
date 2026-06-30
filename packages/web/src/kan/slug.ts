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
  irn: { name: "איראן", flag: "🇮🇷" },
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
  swe: { name: "שוודיה", flag: "🇸🇪" },
  civ: { name: "חוף השנהב", flag: "🇨🇮" },
  nga: { name: "ניגריה", flag: "🇳🇬" },
  egy: { name: "מצרים", flag: "🇪🇬" },
  alg: { name: "אלג׳יריה", flag: "🇩🇿" },
  aut: { name: "אוסטריה", flag: "🇦🇹" },
  ukr: { name: "אוקראינה", flag: "🇺🇦" },
  rou: { name: "רומניה", flag: "🇷🇴" },
  hun: { name: "הונגריה", flag: "🇭🇺" },
  gre: { name: "יוון", flag: "🇬🇷" },
  nor: { name: "נורווגיה", flag: "🇳🇴" },
  fin: { name: "פינלנד", flag: "🇫🇮" },
  irl: { name: "אירלנד", flag: "🇮🇪" },
  isl: { name: "איסלנד", flag: "🇮🇸" },
  svk: { name: "סלובקיה", flag: "🇸🇰" },
  svn: { name: "סלובניה", flag: "🇸🇮" },
  bul: { name: "בולגריה", flag: "🇧🇬" },
  rus: { name: "רוסיה", flag: "🇷🇺" },
  alb: { name: "אלבניה", flag: "🇦🇱" },
  mkd: { name: "מקדוניה הצפונית", flag: "🇲🇰" },
  mne: { name: "מונטנגרו", flag: "🇲🇪" },
  kos: { name: "קוסובו", flag: "🇽🇰" },
  geo: { name: "גאורגיה", flag: "🇬🇪" },
  arm: { name: "ארמניה", flag: "🇦🇲" },
  aze: { name: "אזרבייג׳ן", flag: "🇦🇿" },
  kaz: { name: "קזחסטן", flag: "🇰🇿" },
  blr: { name: "בלארוס", flag: "🇧🇾" },
  mda: { name: "מולדובה", flag: "🇲🇩" },
  lva: { name: "לטביה", flag: "🇱🇻" },
  ltu: { name: "ליטא", flag: "🇱🇹" },
  est: { name: "אסטוניה", flag: "🇪🇪" },
  lux: { name: "לוקסמבורג", flag: "🇱🇺" },
  cyp: { name: "קפריסין", flag: "🇨🇾" },
  mlt: { name: "מלטה", flag: "🇲🇹" },
  chi: { name: "צ׳ילה", flag: "🇨🇱" },
  per: { name: "פרו", flag: "🇵🇪" },
  ven: { name: "ונצואלה", flag: "🇻🇪" },
  bol: { name: "בוליביה", flag: "🇧🇴" },
  hon: { name: "הונדורס", flag: "🇭🇳" },
  slv: { name: "אל סלבדור", flag: "🇸🇻" },
  gua: { name: "גואטמלה", flag: "🇬🇹" },
  jam: { name: "ג׳מייקה", flag: "🇯🇲" },
  tri: { name: "טרינידד וטובגו", flag: "🇹🇹" },
  cub: { name: "קובה", flag: "🇨🇺" },
  dom: { name: "הרפובליקה הדומיניקנית", flag: "🇩🇴" },
  sur: { name: "סורינאם", flag: "🇸🇷" },
  nzl: { name: "ניו זילנד", flag: "🇳🇿" },
  fij: { name: "פיג׳י", flag: "🇫🇯" },
  chn: { name: "סין", flag: "🇨🇳" },
  jor: { name: "ירדן", flag: "🇯🇴" },
  irq: { name: "עיראק", flag: "🇮🇶" },
  uae: { name: "איחוד האמירויות", flag: "🇦🇪" },
  omn: { name: "עומאן", flag: "🇴🇲" },
  bhr: { name: "בחריין", flag: "🇧🇭" },
  kuw: { name: "כווית", flag: "🇰🇼" },
  syr: { name: "סוריה", flag: "🇸🇾" },
  leb: { name: "לבנון", flag: "🇱🇧" },
  pal: { name: "פלסטין", flag: "🇵🇸" },
  prk: { name: "צפון קוריאה", flag: "🇰🇵" },
  tjk: { name: "טג׳יקיסטן", flag: "🇹🇯" },
  kgz: { name: "קירגיזסטן", flag: "🇰🇬" },
  tha: { name: "תאילנד", flag: "🇹🇭" },
  vie: { name: "וייטנאם", flag: "🇻🇳" },
  idn: { name: "אינדונזיה", flag: "🇮🇩" },
  mas: { name: "מלזיה", flag: "🇲🇾" },
  ind: { name: "הודו", flag: "🇮🇳" },
  mli: { name: "מאלי", flag: "🇲🇱" },
  bfa: { name: "בורקינה פאסו", flag: "🇧🇫" },
  gui: { name: "גינאה", flag: "🇬🇳" },
  gab: { name: "גבון", flag: "🇬🇦" },
  cpv: { name: "כף ורדה", flag: "🇨🇻" },
  cod: { name: "קונגו (דמוקרטית)", flag: "🇨🇩" },
  ang: { name: "אנגולה", flag: "🇦🇴" },
  zam: { name: "זמביה", flag: "🇿🇲" },
  zim: { name: "זימבבואה", flag: "🇿🇼" },
  ken: { name: "קניה", flag: "🇰🇪" },
  uga: { name: "אוגנדה", flag: "🇺🇬" },
  ben: { name: "בנין", flag: "🇧🇯" },
  tog: { name: "טוגו", flag: "🇹🇬" },
  mtn: { name: "מאוריטניה", flag: "🇲🇷" },
  nam: { name: "נמיביה", flag: "🇳🇦" },
  gam: { name: "גמביה", flag: "🇬🇲" },
  lby: { name: "לוב", flag: "🇱🇾" },
  sdn: { name: "סודאן", flag: "🇸🇩" },
  eth: { name: "אתיופיה", flag: "🇪🇹" },
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

/**
 * Map a Kan Hebrew team name (as it appears in a VOD card's aria-label) to its
 * FIFA-ish code, so we can show the right flag/canonical name. These are Kan's
 * own spellings — they don't always match the display names in `TEAMS` (e.g.
 * Kan writes "ארצות הברית" where TEAMS has "ארה״ב", and uses a plain apostrophe
 * in "אלג'יריה"/"צ'כיה"). Knockout slugs like `game73` carry no codes, so this
 * is the only way to resolve their teams. Several names map to one code where
 * Kan uses more than one spelling.
 */
const NAME_TO_CODE: Record<string, string> = {
  "אלג'יריה": "alg",
  "ארגנטינה": "arg",
  "אוסטרליה": "aus",
  "אוסטריה": "aut",
  "בלגיה": "bel",
  "בוסניה והרצגובינה": "bih",
  "בוסניה": "bih",
  "ברזיל": "bra",
  "קנדה": "can",
  "חוף השנהב": "civ",
  "קונגו": "cod",
  "קונגו DR": "cod",
  "קולומביה": "col",
  "כף ורדה": "cpv",
  "קרואטיה": "cro",
  "קוראסאו": "cur",
  "קורסאו": "cur",
  "צ'כיה": "cze",
  "אקוודור": "ecu",
  "מצרים": "egy",
  "אנגליה": "eng",
  "ספרד": "esp",
  "צרפת": "fra",
  "גרמניה": "ger",
  "גאנה": "gha",
  "האיטי": "hai",
  "איראן": "irn",
  "עיראק": "irq",
  "ירדן": "jor",
  "יפן": "jpn",
  "קוריאה הדרומית": "kor",
  "דרום קוריאה": "kor",
  "ערב הסעודית": "ksa",
  "מרוקו": "mar",
  "מקסיקו": "mex",
  "הולנד": "ned",
  "נורווגיה": "nor",
  "ניו זילנד": "nzl",
  "פנמה": "pan",
  "פרגוואי": "par",
  "פורטוגל": "por",
  "קטאר": "qat",
  "דרום אפריקה": "rsa",
  "סקוטלנד": "sco",
  "סנגל": "sen",
  "שווייץ": "sui",
  "שוודיה": "swe",
  "תוניסיה": "tun",
  "טורקיה": "tur",
  "אורוגוואי": "uru",
  "ארצות הברית": "usa",
  "אוזבקיסטן": "uzb",
};

/**
 * Resolve a Hebrew team name to its code. Returns null if we don't recognise
 * the name, so callers can fall back to showing the raw name.
 */
export function codeFromName(name: string): string | null {
  return NAME_TO_CODE[name.trim()] ?? null;
}
