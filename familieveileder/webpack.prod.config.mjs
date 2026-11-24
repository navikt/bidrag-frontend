import { merge } from "webpack-merge";

import webpackCommon from "./webpack.common.config.mjs";
const { EnvironmentPlugin } = webpack;

const REQUIRED_ENV_VARS = {
    BIDRAG_PERSON_URL: "",
    BIDRAG_SAK_URL: "",
    BIDRAG_TILGANGSKONTROLL_URL: "",
    BISYS_URL: "",
    BIDRAG_SAMHANDLER_URL: "",
    BIDRAG_ORGANISASJON_URL: "",
    BIDRAG_DOKUMENT_URL: "",
    BIDRAG_RESKONTRO_URL: "",
    BIDRAG_BELOPSHISTORIKK_URL: "",
    BIDRAG_VEDTAK_URL: "",
    UNLEASH_API_URL: "",
    UNLEASH_FRONTEND_TOKEN: "",
};

const OPTIONAL_ENV_VARS = {
    STATIC_FILES_URL: "",
    LEGACY_ENVIRONMENT: "",
};

class ValidateEnvPlugin {
    apply(compiler) {
        compiler.hooks.beforeRun.tapAsync("ValidateEnvPlugin", (_, callback) => {
            const hasEnv = Object.keys(REQUIRED_ENV_VARS).some((key) => process.env[key]);
            if (!hasEnv && !process.env.CI) {
                callback();
                return;
            }
            const result = envSchema.safeParse(process.env);
            if (!result.success) {
                const errors = result.error.issues.map((i) => `  - ${i.path[0]}: ${i.message}`);
                callback(new Error(`\n❌ Miljøvariabel-validering feilet:\n${errors.join("\n")}\n`));
            } else {
                console.log("✅ Miljøvariabler OK");
                callback();
            }
        });
    }
}
export default merge(webpackCommon, {
    mode: "production",
    devtool: "source-map",
    plugins: [new ValidateEnvPlugin(), new EnvironmentPlugin({ ...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS })],
});
