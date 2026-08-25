import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            // @bidrag/common deklarerer ikke react selv, så vi peker på react-versjonen her
            react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
        },
    },
    test: {
        // Flere hjelpefiler drar inn nettleser-avhengige moduler (bl.a. quill)
        environment: "jsdom",
    },
});
