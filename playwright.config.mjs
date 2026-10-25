import { defineConfig } from "@playwright/test";

const port = Number(process.env.TRAVEL_LITE_TEST_PORT) || 4317;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: ["mobile-layout.spec.mjs", "style-options.spec.mjs", "phase2-packs.spec.mjs",
    "style-settings.spec.mjs", "nine-looks.spec.mjs", "second-prompt-batch.spec.mjs",
    "responsive-style-picker.spec.mjs", "export-ui.spec.mjs", "site-storage.spec.mjs",
    "journey-confidence.spec.mjs", "vintage-a5.spec.mjs", "vintage-watercolor.spec.mjs", "vintage-framing.spec.mjs",
    "bottom-nav-fixed.spec.mjs", "places-transport.spec.mjs",
    "style-surface-padding.spec.mjs", "style-surface-role.spec.mjs",
    "style-semantic-parity.spec.mjs", "style-surface-matrix.spec.mjs",
    "style-text-zoom.spec.mjs"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/serve.mjs",
    url: baseURL,
    // Never reuse: an unrelated local server on this port would be tested silently.
    reuseExistingServer: false,
    timeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
