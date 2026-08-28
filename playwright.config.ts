import { defineConfig, devices } from "@playwright/test";

/**
 * Felles Playwright-config for komponenttesting (CT) på tvers av hele monorepoet.
 *
 * Ett felles story-galleri (se apps/web/playwright/gallery/) servert av én
 * frittstående Vite-server, siden @playwright/experimental-ct-react sin
 * Rolldown-bundling krasjer på @navikt/ds-react. Galleriet globber
 * *.story.tsx fra BÅDE apps/web og @bidrag/common, slik at man kan navigere
 * mellom stories i begge pakker fra samme venstremeny. Se
 * .github/skills/playwright-component-testing/ for bakgrunn og kontrakt.
 *
 * Kjør alt: `pnpm test:ct` fra repo-roten.
 * Kjør kun én pakke: `pnpm test:ct -- --project=web` eller `--project=common`.
 */

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
        // Dreper ev. hengende prosess på galleri-porten før oppstart (enkel bash,
        // kun macOS/Linux) - kjøres kun når Playwright faktisk MÅ starte en ny
        // server (dvs. ingen allerede kjører/svarer på url-en over).
        command:
            "lsof -ti tcp:3178 | xargs kill -9 2>/dev/null; node node_modules/vite/bin/vite.js --config playwright/vite.config.ts",
        cwd: "./apps/web",
        url: galleryUrl,
        reuseExistingServer: !process.env.CI,
    },
});
