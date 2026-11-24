import { merge } from "webpack-merge";
import { EnvironmentPlugin }  from "webpack";

import webpackCommon from "./webpack.common.config.mjs";

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

export default merge(webpackCommon, {
    mode: "production",
    devtool: "source-map",
    plugins: [new EnvironmentPlugin({ ...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS })],
});
