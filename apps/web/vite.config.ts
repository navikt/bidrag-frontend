import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [reactRouter(), tailwindcss()],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        port: 3000,
        host: true, // Lytt på 0.0.0.0 slik at host.docker.internal kan nå serveren
    },
    // Peker klientbundlene mot CDN i prod, se .github/workflows/build-and-test.yml
    base: process.env.CDN_BASE_URL,
    build: {
        sourcemap: true,
        rollupOptions: {
            // Absolutt sti slik at nais.js alltid hentes fra samme origin som siden,
            // uavhengig av CDN_BASE_URL (nais.js genereres og monteres av Nais i poden)
            external: ["/nais.js"],
        },
    },
    optimizeDeps: {
        exclude: [
            "@bidrag/common",
            "@bidrag/api",
            "@bidrag/utils",
        ],
    },
});
