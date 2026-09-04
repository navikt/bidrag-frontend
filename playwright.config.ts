import { defineConfig, devices } from "@playwright/test";

/** Felles Playwright-konfigurasjon for komponenttesting. */
const galleryUrl = "http://localhost:3178/playwright/gallery/index.html";

const galleryProjectUse = {
    ...devices["Desktop Chrome"],
    baseURL: galleryUrl,
    serviceWorkers: "block" as const,
    reuseContext: true,
    trace: "on-first-retry" as const,
};

export default defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [["html", { open: "never" }]],
    projects: [
        {
            name: "web",
            testDir: "./apps/web/app",
            testMatch: "**/*.ct.spec.ts",
            use: galleryProjectUse,
        },
        {
            name: "common",
            testDir: "./packages/common/src",
            testMatch: "**/*.ct.spec.ts",
            use: galleryProjectUse,
        },
    ],
    webServer: {
        // Rydd opp eventuell hengende prosess.
        command:
            "lsof -ti tcp:3178 | xargs kill -9 2>/dev/null; node node_modules/vite/bin/vite.js --config playwright/vite.config.ts",
        cwd: "./apps/web",
        url: galleryUrl,
        reuseExistingServer: !process.env.CI,
    },
});
