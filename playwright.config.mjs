import { defineConfig } from "@playwright/test";

const port = Number(process.env.TRAVEL_LITE_TEST_PORT) || 4317;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "mobile-layout.spec.mjs",
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
