import type { Game } from "../model";
import { teamFromCode } from "../kan/slug";
import { openHighlight } from "./player";

/** Render a single spoiler-free game card. */
function renderCard(game: Game): HTMLElement {
  const [aCode, bCode] = game.teams;
  const a = teamFromCode(aCode);
  const b = teamFromCode(bCode);

  const card = document.createElement("button");
  card.className = "card";
  card.type = "button";
  card.setAttribute(
    "aria-label",
    `צפייה בתקציר: ${a.name} מול ${b.name}`,
  );

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
    ${game.date ? `<div class="card__date">${game.date}</div>` : ""}
    <div class="card__watch">▶ צפו בתקציר</div>
  `;

  card.addEventListener("click", () => openHighlight(game));
  return card;
}

/** Render the full grid of games into the given container. */
export function renderGames(container: HTMLElement, games: Game[]): void {
  container.innerHTML = "";
  if (games.length === 0) {
    container.appendChild(renderEmpty());
    return;
  }
  const grid = document.createElement("div");
  grid.className = "grid";
  games.forEach((g) => grid.appendChild(renderCard(g)));
  container.appendChild(grid);
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
