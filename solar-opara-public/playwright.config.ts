import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:4173",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1920, height: 1080 } } },
    { name: "notebook", use: { viewport: { width: 1366, height: 768 } } },
    { name: "tablet", use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "compact", use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: "node scripts/preview-for-tests.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
