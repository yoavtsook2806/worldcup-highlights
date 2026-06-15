import type { Game } from "../model";
import { teamFromCode } from "../kan/slug";
import { isSeen, markSeen } from "../kan/seen";
import { openHighlight } from "./player";

const SEEN_LABEL = "✓ נצפה";

// Date helpers — bucket and label games by their "broadcast day" in Israel time.
// Kickoffs before this hour count as the previous day, matching how viewers
// think of them: 01:00/02:00 games belong to the night before, 03:00+ are new.
const DAY_CUTOFF_HOURS = 3;
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jerusalem",
});
const dayTitleFmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Jerusalem",
});

/** The kickoff shifted back by the cutoff, so overnight games roll to the prior day. */
function broadcastDay(iso: string): Date {
  return new Date(new Date(iso).getTime() - DAY_CUTOFF_HOURS * 3600_000);
}

interface DateGroup {
  key: string;
  title: string;
  games: Game[];
}

function groupByDate(games: Game[]): DateGroup[] {
  const map = new Map<string, Game[]>();
  for (const g of games) {
    const key = g.date ? dayKeyFmt.format(broadcastDay(g.date)) : "unknown";
    const bucket = map.get(key);
    if (bucket) bucket.push(g);
    else map.set(key, [g]);
  }
  const groups: DateGroup[] = [...map.entries()].map(([key, list]) => {
    // Within a day, show the most recent kickoff first; undated games last.
    list.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : -Infinity;
      const tb = b.date ? new Date(b.date).getTime() : -Infinity;
      return tb - ta;
    });
    return {
      key,
      title:
        key === "unknown"
          ? "תאריך לא ידוע"
          : dayTitleFmt.format(broadcastDay(list[0].date!)),
      games: list,
    };
  });
  // Most recent day first; undated bucket last.
  groups.sort((a, b) => {
    if (a.key === "unknown") return 1;
    if (b.key === "unknown") return -1;
    return b.key.localeCompare(a.key);
  });
  return groups;
}

function makeSeenBadge(): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "card__seen";
  badge.textContent = SEEN_LABEL;
  return badge;
}

/** Render a single spoiler-free game card. */
function renderCard(game: Game): HTMLElement {
  const [aCode, bCode] = game.teams;
  const a = teamFromCode(aCode);
  const b = teamFromCode(bCode);

  const card = document.createElement("button");
  card.className = "card";
  card.type = "button";
  card.setAttribute("aria-label", `צפייה בתקציר: ${a.name} מול ${b.name}`);

  // Only team names/flags + a watch label. Deliberately NO score/result.
  card.innerHTML = `
    <div class="card__teams">
      <span class="team">
        <span class="team__flag">${a.flag}</span>
        <span class="team__name">${a.name}</span>
      </span>
      <span class="vs">VS</span>
      <span class="team">
        <span class="team__flag">${b.flag}</span>
        <span class="team__name">${b.name}</span>
      </span>
    </div>
    <div class="card__watch">▶ צפו בתקציר</div>
  `;

  if (isSeen(game.id)) {
    card.classList.add("card--seen");
    card.prepend(makeSeenBadge());
  }

  card.addEventListener("click", () => {
    openHighlight(game);
    if (!isSeen(game.id)) {
      markSeen(game.id);
      card.classList.add("card--seen");
      card.prepend(makeSeenBadge());
    }
  });
  return card;
}

/** Render the full, date-grouped list of games into the given container. */
export function renderGames(container: HTMLElement, games: Game[]): void {
  container.innerHTML = "";
  if (games.length === 0) {
    container.appendChild(renderEmpty());
    return;
  }

  const groups = groupByDate(games);
  const showDividers = !(groups.length === 1 && groups[0].key === "unknown");

  for (const group of groups) {
    if (showDividers) {
      const divider = document.createElement("div");
      divider.className = "date-divider";
      const label = document.createElement("span");
      label.className = "date-divider__label";
      label.textContent = group.title;
      divider.appendChild(label);
      container.appendChild(divider);
    }
    const grid = document.createElement("div");
    grid.className = "grid";
    group.games.forEach((g) => grid.appendChild(renderCard(g)));
    container.appendChild(grid);
  }
}

export function renderLoading(container: HTMLElement): void {
  container.innerHTML = `<div class="status">טוען תקצירים…</div>`;
}

export function renderError(container: HTMLElement, message: string): void {
  container.innerHTML = `
    <div class="status status--error">
      <p>לא הצלחנו לטעון את התקצירים.</p>
      <p class="status__detail">${escapeHtml(message)}</p>
      <p class="status__hint">
        ייתכן שהאתר חסום מחוץ לישראל או שהדפדפן חוסם את הבקשה החוצה (CORS).
      </p>
    </div>`;
}

function renderEmpty(): HTMLElement {
  const el = document.createElement("div");
  el.className = "status";
  el.textContent = "לא נמצאו תקצירים כרגע.";
  return el;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
