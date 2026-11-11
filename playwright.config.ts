import { defineConfig, devices } from "@playwright/test";

/** Felles Playwright-konfigurasjon for komponenttesting. */
const galleryUrl = "http://localhost:3178/playwright/gallery/index.html";

const galleryProjectUse = {
    ...devices["Desktop Chrome"],
    baseURL: galleryUrl,
    serviceWorkers: "block" as const,
    reuseContext: true,
    trace: "retain-on-failure" as const,
};

export default defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [["html", { open: "never" }]],
    projects: [
        {
            name: "components",
            testDir: ".",
            testMatch: "**/*.ct.spec.ts",
            use: galleryProjectUse,
        },
        {
            name: "components-slow",
            testDir: ".",
            testMatch: "**/*.ct.spec.ts",
            workers: 1,
            use: {
                ...galleryProjectUse,
                viewport: { width: 1600, height: 1080 },
                launchOptions: { slowMo: 1000 },
            },
        },
    ],
    webServer: {
        command: "pnpm exec vite --config playwright/vite.config.ts",
        url: galleryUrl,
        reuseExistingServer: !process.env.CI,
    },
});
