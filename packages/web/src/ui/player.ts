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
 * to fill the viewport.
 *
 * Two scaling techniques, chosen per platform (see SCALE_VIA_ZOOM):
 *  - `transform: scale()` on the iframe — correct everywhere EXCEPT Android
 *    Chrome, where a transform on a cross-origin iframe mis-routes touch
 *    coordinates so the player's controls stop responding / never auto-hide.
 *  - CSS `zoom` on the clip — keeps touch routing correct on Android, but
 *    renders the crop wrong on iOS Safari.
 * So: Android gets `zoom`, iOS + desktop get `transform`.
 *
 * The user can press the player's own play button (the page auto-plays muted)
 * and its fullscreen control — both live inside the cropped region, so the
 * score is never shown. On desktop the player's fullscreen would otherwise
 * fullscreen the whole (uncropped) iframe and expose the score, so we bounce
 * out of it back to the cropped overlay — see onFullscreenChange.
 */

// Calibrated on kan.org.il game pages — see project history.
const FRAME_W = 1170; // logical width we force the Kan page to render at
const FRAME_H = 780; // tall enough to include the player (its bottom is ~526px)
const CROP = { x: 24, y: 110, w: 755, h: 416 }; // player rect at FRAME_W

// Android Chrome mis-routes touch on transformed cross-origin iframes; use
// `zoom` there. iOS renders `zoom` crops wrong, so it (and desktop) use
// `transform`. iPadOS reports as "Macintosh" but has touch — treat as iOS.
const ua = navigator.userAgent;
const isAndroid = /Android/i.test(ua);
const isIOS =
  /iP(hone|ad|od)/i.test(ua) ||
  // iPadOS 13+ identifies as a Mac, but unlike a real Mac it is touch-capable.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isDesktop = !isAndroid && !isIOS;
const SCALE_VIA_ZOOM = isAndroid;

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

  // The iframe always renders the Kan page at FRAME_W (desktop layout) so the
  // calibrated crop stays valid; only the scaling technique differs.
  iframe.style.width = `${FRAME_W}px`;
  iframe.style.height = `${FRAME_H}px`;
  if (SCALE_VIA_ZOOM) {
    // Android: position the iframe so the player rect is at the clip's
    // top-left, size the clip to the rect, then `zoom` the clip to fit.
    iframe.style.left = `${-CROP.x}px`;
    iframe.style.top = `${-CROP.y}px`;
  }

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
    const scale = w / CROP.w;
    if (SCALE_VIA_ZOOM) {
      clip.style.width = `${CROP.w}px`;
      clip.style.height = `${CROP.h}px`;
      clip.style.setProperty("zoom", String(scale));
    } else {
      clip.style.width = `${w}px`;
      clip.style.height = `${h}px`;
      iframe.style.transform = `scale(${scale}) translate(${-CROP.x}px, ${-CROP.y}px)`;
    }
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

  // On desktop, the player's own fullscreen button makes the cross-origin
  // iframe ELEMENT the fullscreen element — and a fullscreened iframe fills the
  // screen ignoring our crop, exposing the score. Bounce out of that so we fall
  // back to the already-fullscreen, still-cropped overlay. iOS hands fullscreen
  // to the system video player (video only, no page), so it's left untouched.
  function onFullscreenChange(): void {
    if (isDesktop && document.fullscreenElement === iframe) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    layout();
  }

  function cleanup(): void {
    window.clearTimeout(framingTimeout);
    window.removeEventListener("resize", layout);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    document.removeEventListener("keydown", onKey);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    overlay.remove();
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === "Escape") cleanup();
  }

  window.addEventListener("resize", layout);
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("keydown", onKey);
  closeBtn.addEventListener("click", cleanup);

  document.body.appendChild(overlay);

  // Make the overlay immersive (whole screen). The player's own fullscreen
  // button still works for true video-only fullscreen.
  overlay.requestFullscreen?.().then(layout).catch(() => {});
}
