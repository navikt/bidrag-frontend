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
    build: {
        sourcemap: true,
        rollupOptions: {
            external: ["./nais.js"],
        },
    },
    optimizeDeps: {
        exclude: [
            "@bidrag/common",
            "@bidrag/api",
            "@bidrag/ui",
            "@bidrag/utils",
            "@bidrag/types",
        ],
    },
});
