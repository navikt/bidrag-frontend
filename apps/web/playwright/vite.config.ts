import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Vite-server for Playwright-galleriet. */
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
