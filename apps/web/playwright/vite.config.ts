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
        // Forhåndstransformerer galleri-inngangen (main.tsx/stories.ts) og
        // alle story-filer ved oppstart, slik at Vite ikke lazily
        // kompilerer/invaliderer moduler midt i en parallell
        // Playwright-kjøring (mange workers mot samme delte dev-server).
        // Reduserer risikoen for "Execution context was destroyed, most
        // likely because of a navigation" pga. et full-reload Vite sender
        // til allerede tilkoblede sider.
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
