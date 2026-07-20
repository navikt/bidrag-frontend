import * as process from "node:process";
import { z } from "zod";

const NonEmpty = z.string().min(1);
const Url = z.string().url();

const EnvSchema = z.object({
    BIDRAG_SAK_URL: Url,
    BIDRAG_SAK_AUDIENCE: NonEmpty,
    BIDRAG_ORGANISASJON_URL: Url,
    BIDRAG_ORGANISASJON_AUDIENCE: NonEmpty,
    BIDRAG_PERSON_URL: Url,
    BIDRAG_PERSON_AUDIENCE: NonEmpty,
    BIDRAG_TILGANGSKONTROLL_URL: Url,
    BIDRAG_TILGANGSKONTROLL_AUDIENCE: NonEmpty,
    BIDRAG_SAMHANDLER_URL: Url,
    BIDRAG_SAMHANDLER_AUDIENCE: NonEmpty,
    BIDRAG_BELOPSHISTORIKK_URL: Url,
    BIDRAG_BELOPSHISTORIKK_AUDIENCE: NonEmpty,
    BIDRAG_VEDTAK_URL: Url,
    BIDRAG_VEDTAK_AUDIENCE: NonEmpty,
    BIDRAG_RESKONTRO_URL: Url,
    BIDRAG_RESKONTRO_AUDIENCE: NonEmpty,
    BIDRAG_DOKUMENT_URL: Url,
    BIDRAG_DOKUMENT_AUDIENCE: NonEmpty,
    BISYS_URL: Url,
    BIDRAG_UI_BASE_URL: Url,
    NODE_ENV: z.enum(["development", "test", "production"]),
    STACKTRACE_SOURCE_MAP_ALLOWED_HOSTS: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
