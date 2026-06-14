# World Cup Highlights — spoiler-free

A tiny, fully-static web page that lists World Cup highlights sourced **live** from
[kan.org.il](https://www.kan.org.il/content/worldcup/games/) and lets you watch one **without
revealing the score**, so you can enjoy the highlight without knowing how the game ended.

- **No backend.** The page scans Kan at runtime, directly from your browser.
- **Vite + TypeScript**, organized as a **yarn workspace** (`packages/web`).
- Clicking a game opens its highlight in a fullscreen overlay (with a new-tab fallback).

## Getting started

```bash
yarn install
yarn dev        # http://localhost:5173
yarn build      # static output in packages/web/dist
```

## ⚠️ Important constraint: Cloudflare + geo-restriction

`kan.org.il` is behind a **Cloudflare WAF rule (error 1020)** and is likely **geo-restricted to
Israel**. Because this app is purely static, the highlight list is fetched by *your browser* at
runtime — so it will only work when:

1. Your browser is on an **allowed (Israeli) IP**, and
2. Cloudflare permits the **cross-origin `fetch()`** the page makes.

Public CORS proxies generally **won't** help (they run on datacenter IPs that Kan blocks).

### 30-second feasibility check

Before relying on it, open your browser DevTools console and run:

```js
fetch('https://www.kan.org.il/content/worldcup/games/', { mode: 'cors' })
  .then(r => r.text()).then(t => console.log('OK', t.length))
  .catch(e => console.error('BLOCKED', e));
```

- `OK <length>` → the app will work for you.
- A CORS/network error → direct fetching is blocked from your environment; a static-only app
  cannot scan Kan at runtime, and you'd need a small server/scheduled-scraper instead.

## How it stays spoiler-free

- The `Game` model (`src/model.ts`) has **no score field** by design.
- The parser (`src/kan/parse.ts`) keys only off the game **slug** (`…/games/ausvstur/`) and
  derives team names from it — it never reads on-page text/thumbnails that could carry the score.
- Only games with a **real published highlight** are shown: each game page is checked for the
  VOD stream (`type=MOVIE`) / `/s1/<id>` highlight link, so future/projected fixtures are
  filtered out (`pageHasHighlight` in `src/kan/parse.ts`).

### Playback: why we crop instead of using our own player

The highlight video is **DRM-protected** (Widevine/FairPlay) and is served only through Kan's
own RedGalaxy player; the stream API is also CORS-locked. So we **cannot** extract the raw
stream and play it ourselves. Instead, `src/ui/player.ts` embeds Kan's game page in an iframe
and **clips it to exactly the video-player rectangle** — the score card (to the right), the
spoiler headline and the result-bearing thumbnails (below) all fall outside the crop. The
geometry is calibrated against Kan's desktop layout at a fixed iframe width (`FRAME_W`/`CROP`
constants). The page auto-plays muted; the user can use the player's own play/fullscreen
controls, all inside the cropped region, so the score is never revealed.

> If Kan ever forbids framing, the player falls back to opening the page in a new tab. If Kan
> changes its layout, re-calibrate the `CROP` constants in `src/ui/player.ts`.

## Deploying (GitHub Pages)

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the app and publishes
`packages/web/dist` to GitHub Pages. Vite's `base` is relative (`./`) so it works under the
project subpath `https://<user>.github.io/<repo>/`.

> The hosted site still fetches `kan.org.il` from the visitor's browser, so it only works for
> visitors on an allowed (Israeli) IP — same constraint as local dev.

> **Local install behind a corporate network:** this repo uses the public npm registry. If
> `yarn install` can't reach it, point `npmRegistryServer` at your internal registry in a local
> (untracked) `.yarnrc.yml` — don't commit it.

## Project structure

```
packages/web/src/
  main.ts            # bootstrap: load → parse → render, Refresh button
  model.ts           # Game type (no score)
  kan/
    config.ts        # URLs, proxy fallbacks, cache TTL
    fetch.ts         # fetch with cache + proxy fallback
    parse.ts         # DOMParser extraction (refine from real Kan HTML)
    slug.ts          # "ausvstur" → team names/flags
  ui/
    cards.ts         # spoiler-free grid
    player.ts        # fullscreen iframe overlay + new-tab fallback
```

### Tuning the parser

`src/kan/parse.ts` is the one piece tied to Kan's exact markup. If the live page changes, paste
the current HTML of the list page and adjust the selector/scope there.
