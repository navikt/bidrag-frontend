import { env } from "./env.server.ts";

type ApiConfig = {
  url: string;
  audience: string;
};

const APIS: Record<string, ApiConfig> = {
  "bidrag-admin": {
    url: process.env.BIDRAG_ADMIN_URL || "",
    audience: process.env.BIDRAG_ADMIN_AUDIENCE || ""
  },
  "bidrag-sak": {
    url: env.BIDRAG_SAK_URL,
    audience: env.BIDRAG_SAK_AUDIENCE,
  },
  "bidrag-organisasjon": {
    url: env.BIDRAG_ORGANISASJON_URL,
    audience: env.BIDRAG_ORGANISASJON_AUDIENCE,
  },
  "bidrag-person": {
    url: env.BIDRAG_PERSON_URL,
    audience: env.BIDRAG_PERSON_AUDIENCE,
  },
  "bidrag-tilgangskontroll": {
    url: env.BIDRAG_TILGANGSKONTROLL_URL,
    audience: env.BIDRAG_TILGANGSKONTROLL_AUDIENCE,
  },
  "bidrag-samhandler": {
    url: env.BIDRAG_SAMHANDLER_URL,
    audience: env.BIDRAG_SAMHANDLER_AUDIENCE,
  },
  "bidrag-belopshistorikk": {
    url: env.BIDRAG_BELOPSHISTORIKK_URL,
    audience: env.BIDRAG_BELOPSHISTORIKK_AUDIENCE,
  },
  "bidrag-vedtak": {
    url: env.BIDRAG_VEDTAK_URL,
    audience: env.BIDRAG_VEDTAK_AUDIENCE,
  },
  "bidrag-reskontro": {
    url: env.BIDRAG_RESKONTRO_URL,
    audience: env.BIDRAG_RESKONTRO_AUDIENCE,
  },
    "bidrag-dokument": {
        url: env.BIDRAG_DOKUMENT_URL,
        audience: env.BIDRAG_DOKUMENT_AUDIENCE,
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
