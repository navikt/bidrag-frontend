import * as process from "node:process";

type ApiConfig = {
    url: string;
    audience: string;
};

const APIS: Record<string, ApiConfig> = {
    "bidrag-sak": {
        url: process.env.BIDRAG_SAK_URL || "",
        audience: process.env.BIDRAG_SAK_AUDIENCE || "",
    },
    "bidrag-organisasjon": {
        url: process.env.BIDRAG_ORGANISASJON_URL || "",
        audience: process.env.BIDRAG_ORGANISASJON_AUDIENCE || "",
    },
    "bidrag-person": {
        url: process.env.BIDRAG_PERSON_URL || "",
        audience: process.env.BIDRAG_PERSON_AUDIENCE || "",
    },
    "bidrag-tilgangskontroll": {
        url: process.env.BIDRAG_TILGANGSKONTROLL_URL || "",
        audience: process.env.BIDRAG_TILGANGSKONTROLL_AUDIENCE || "",
    },
    "bidrag-samhandler": {
        url: process.env.BIDRAG_SAMHANDLER_URL || "",
        audience: process.env.BIDRAG_SAMHANDLER_AUDIENCE || "",
    },
    "bidrag-belopshistorikk": {
        url: process.env.BIDRAG_BELOPSHISTORIKK_URL || "",
        audience: process.env.BIDRAG_BELOPSHISTORIKK_AUDIENCE || "",
    },
    "bidrag-vedtak": {
        url: process.env.BIDRAG_VEDTAK_URL || "",
        audience: process.env.BIDRAG_VEDTAK_AUDIENCE || "",
    },
    "bidrag-reskontro": {
        url: process.env.BIDRAG_RESKONTRO_URL || "",
        audience: process.env.BIDRAG_RESKONTRO_AUDIENCE || "",
    },
    "bidrag-dokument": {
        url: process.env.BIDRAG_DOKUMENT_URL || "",
        audience: process.env.BIDRAG_DOKUMENT_AUDIENCE || "",
    },
};

export type ApiAppName = keyof typeof APIS | string;

export function getApiConfig(app: ApiAppName): ApiConfig {
    const api = APIS[app];
    if (!api) {
        throw new Error(`API config not found for app: ${app}`);
    }
    return api;
}
