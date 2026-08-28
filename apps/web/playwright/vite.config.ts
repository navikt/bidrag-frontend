import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Frittstående Vite-dev-server kun for Playwright sin "story gallery"-side.
 *
 * apps/web kjører til vanlig via React Router sin SSR-dev-server (`react-router dev`),
 * som ikke passer for en enkel klient-rendret galleri-side. Vi kjører derfor en liten,
 * isolert Vite-server som eneste jobb er å servere `playwright/gallery/index.html` og
 * resolve *.story.tsx-filer i BÅDE `app/` (apps/web) og `packages/common/src/`
 * (se `playwright/gallery/main.tsx` for glob-oppsettet) - ett felles galleri for
 * begge pakker, servert fra denne serveren.
 *
 * `root` peker til pakkeroten (apps/web), slik at URL-en matcher den fysiske
 * filplasseringen: <root>/playwright/gallery/index.html.
 */
export default defineConfig({
    root: fileURLToPath(new URL("..", import.meta.url)),
    plugins: [react()],
    resolve: {
        alias: {
            "~": fileURLToPath(new URL("../app", import.meta.url)),
        },
    },
    server: {
        port: 3178,
        strictPort: true,
    },
});
