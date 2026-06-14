import { defineConfig } from "vite";

// Static SPA — no backend. See README for the Cloudflare/geo constraint.
// Relative base so the build works under a GitHub Pages project subpath
// (https://<user>.github.io/<repo>/) as well as at the root in local dev.
export default defineConfig({
  base: "./",
  server: { port: 5173, open: true },
});
