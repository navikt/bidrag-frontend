import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            // @bidrag/common deklarerer ikke react selv, så vi peker på react-versjonen her
            react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
        },
    },
    // PdfAConverter.ts importerer sRGB2014.icc-fargeprofilen som en binærfil;
    // fortell Vite/Vitest å behandle den som et rått asset i stedet for å
    // prøve å parse den som JS.
    assetsInclude: ["**/*.icc"],
    test: {
        include: ["src/**/*.test.ts"],
        exclude: ["**/node_modules/**"],
        environment: "jsdom",
        globals: true,
    },
});
