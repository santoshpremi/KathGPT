import { defineConfig } from "@playwright/test";

const API_BASE =
  process.env.KATHAGPT_API_BASE ?? "http://127.0.0.1:17890/api/local";

export default defineConfig({
  testDir: "./test/e2e",
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "./start-dev.sh",
    url: "http://localhost:5173/api/local/health",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});

export { API_BASE };
