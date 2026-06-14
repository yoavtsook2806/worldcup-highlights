import type { Game } from "../model";

/**
 * Open a highlight without revealing the score.
 *
 * The highlight video is DRM-protected (Widevine/FairPlay) and served only
 * through Kan's own RedGalaxy player, so we cannot play the raw stream in our
 * own <video>. Instead we embed Kan's game page and CLIP the iframe to exactly
 * the video-player rectangle — the score card (to the right), the spoiler
 * headline and the result-bearing thumbnails (below) all fall outside the crop.
 *
 * The crop geometry is calibrated against Kan's desktop layout rendered at a
 * fixed iframe width (FRAME_W). We force that width so the measured rectangle
 * stays valid regardless of the user's actual screen size, then scale the clip
 * to fill the viewport using CSS `zoom`.
 *
 * Why `zoom` and not `transform: scale()`: a CSS transform on a cross-origin
 * iframe makes Android Chrome mis-route touch coordinates into the frame, so
 * the player's controls don't receive activity events (taps miss, the progress
 * bar never auto-hides). `zoom` is layout/hit-test correct AND keeps the inner
 * page at FRAME_W (desktop layout), so the calibrated crop still lines up.
 *
 * The user can press the player's own play button (the page auto-plays muted)
 * and its fullscreen control — both live inside the cropped region, so the
 * score is never shown.
 */

// Calibrated on kan.org.il game pages — see project history.
const FRAME_W = 1170; // logical width we force the Kan page to render at
const FRAME_H = 780; // tall enough to include the player (its bottom is ~526px)
const CROP = { x: 24, y: 110, w: 755, h: 416 }; // player rect at FRAME_W

export function openHighlight(game: Game): void {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const closeBtn = document.createElement("button");
  closeBtn.className = "overlay__close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "סגירה");
  closeBtn.textContent = "✕";

  const clip = document.createElement("div");
  clip.className = "crop";

  const iframe = document.createElement("iframe");
  iframe.className = "crop__frame";
  iframe.src = game.url;
  iframe.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
  iframe.setAttribute("allowfullscreen", "");

  clip.appendChild(iframe);
  overlay.appendChild(closeBtn);
  overlay.appendChild(clip);

  // The iframe is positioned (unzoomed) so the player rect sits at the clip's
  // top-left; the clip is sized to the player rect and then `zoom`ed to fill
  // the viewport. Zooming the clip (not transforming the iframe) keeps touch
  // routing correct on mobile.
  iframe.style.width = `${FRAME_W}px`;
  iframe.style.height = `${FRAME_H}px`;
  iframe.style.left = `${-CROP.x}px`;
  iframe.style.top = `${-CROP.y}px`;
  clip.style.width = `${CROP.w}px`;
  clip.style.height = `${CROP.h}px`;

  const aspect = CROP.w / CROP.h;
  function layout(): void {
    const maxW = window.innerWidth * 0.96;
    const maxH = window.innerHeight * 0.92;
    let w = maxW;
    let h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    clip.style.setProperty("zoom", String(w / CROP.w));
  }
  layout();

  // Fallback: if Kan ever forbids framing, the iframe stays blank — open a tab.
  let loaded = false;
  iframe.addEventListener("load", () => {
    loaded = true;
  });
  const framingTimeout = window.setTimeout(() => {
    if (!loaded) {
      cleanup();
      window.open(game.url, "_blank", "noopener");
    }
  }, 6000);

  function cleanup(): void {
    window.clearTimeout(framingTimeout);
    window.removeEventListener("resize", layout);
    document.removeEventListener("fullscreenchange", layout);
    document.removeEventListener("keydown", onKey);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    overlay.remove();
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === "Escape") cleanup();
  }

  window.addEventListener("resize", layout);
  document.addEventListener("fullscreenchange", layout);
  document.addEventListener("keydown", onKey);
  closeBtn.addEventListener("click", cleanup);

  document.body.appendChild(overlay);

  // Make the overlay immersive (whole screen). The player's own fullscreen
  // button still works for true video-only fullscreen.
  overlay.requestFullscreen?.().then(layout).catch(() => {});
}
