import { defineConfig } from "vitest/config";

export default defineConfig({
    // PdfAConverter.ts imports the sRGB2014.icc color profile as a binary asset (via a
    // webpack-specific loader in the app build); tell Vite/Vitest to treat it as a raw asset
    // too instead of trying to parse it as JS.
    assetsInclude: ["**/*.icc"],
    test: {
        include: ["src/**/*.test.ts"],
        exclude: ["**/node_modules/**", "**/public/**"],
        environment: "jsdom",
        globals: true,
    },
});
