import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Vite-server for Playwright-galleriet. */
export default defineConfig({
    root: fileURLToPath(new URL("..", import.meta.url)),
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "~": fileURLToPath(new URL("../app", import.meta.url)),
            "@ct": fileURLToPath(new URL(".", import.meta.url)),
        },
    },
    server: {
        port: 3178,
        strictPort: true,
        // Playwrights mount() gjør page.goto() og deretter page.evaluate().
        // goto() resolver på load-eventet, så et full-reload fra Vite i
        // mellomtiden river ned JS-konteksten og gir "Execution context was
        // destroyed, most likely because of a navigation". Galleriet har ingen
        // nytte av HMR — hver mount() laster siden på nytt uansett — så vi
        // fjerner hot-kanalen og filovervåkingen helt i stedet for å redusere
        // sannsynligheten for at de slår til.
        hmr: false,
        watch: null,
        // Forhåndstransformerer galleri-inngangen og story-filene ved oppstart
        // slik at første mount() ikke venter på lazy kompilering.
        warmup: {
            clientFiles: [
                "./playwright/gallery/main.tsx",
                "./playwright/gallery/stories.ts",
                "./app/**/*.story.tsx",
                "../../packages/common/src/**/*.story.tsx",
            ],
        },
    },
});
