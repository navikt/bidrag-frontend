import * as process from "node:process";
import { z } from "zod";

const NonEmpty = z.string().min(1);

const EnvSchema = z.object({
    BIDRAG_ADMIN_URL: z.url(),
    BIDRAG_ADMIN_AUDIENCE: NonEmpty,
    BIDRAG_SAK_URL: z.url(),
    BIDRAG_SAK_AUDIENCE: NonEmpty,
    BIDRAG_ORGANISASJON_URL: z.url(),
    BIDRAG_ORGANISASJON_AUDIENCE: NonEmpty,
    BIDRAG_PERSON_URL: z.url(),
    BIDRAG_PERSON_AUDIENCE: NonEmpty,
    BIDRAG_TILGANGSKONTROLL_URL: z.url(),
    BIDRAG_TILGANGSKONTROLL_AUDIENCE: NonEmpty,
    BIDRAG_SAMHANDLER_URL: z.url(),
    BIDRAG_SAMHANDLER_AUDIENCE: NonEmpty,
    BIDRAG_BELOPSHISTORIKK_URL: z.url(),
    BIDRAG_BELOPSHISTORIKK_AUDIENCE: NonEmpty,
    BIDRAG_VEDTAK_URL: z.url(),
    BIDRAG_VEDTAK_AUDIENCE: NonEmpty,
    BIDRAG_RESKONTRO_URL: z.url(),
    BIDRAG_RESKONTRO_AUDIENCE: NonEmpty,
    BIDRAG_DOKUMENT_URL: z.url(),
    BIDRAG_DOKUMENT_AUDIENCE: NonEmpty,
    BISYS_URL: z.url(),
    BIDRAG_UI_BASE_URL: z.url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    STACKTRACE_SOURCE_MAP_ALLOWED_HOSTS: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
