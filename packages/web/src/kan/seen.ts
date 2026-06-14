/** Tracks which highlights the user has already opened (persisted locally). */

const KEY = "seen-games";

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const seen = load();

export function isSeen(id: string): boolean {
  return seen.has(id);
}

export function markSeen(id: string): void {
  if (seen.has(id)) return;
  seen.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    /* storage full/disabled — best-effort */
  }
}
