import { z } from "zod";

/**
 * Skjema for det klienten sender til `/log`.
 *
 */

const MAKS_MELDING = 4_000;
const MAKS_STACK = 20_000;
const MAKS_CONTEXT_NØKLER = 30;
const MAKS_CONTEXT_VERDI = 500;

const contextVerdi = z.union([z.string().max(MAKS_CONTEXT_VERDI), z.number(), z.boolean(), z.null()]);

const loggetFeilSchema = z.object({
    name: z.string().max(200).default("UnknownError"),
    message: z.string().max(MAKS_MELDING).default("Ukjent feil"),
    stack: z.string().max(MAKS_STACK).optional(),
    componentStack: z.string().max(MAKS_STACK).optional(),
    status: z.number().int().optional(),
    cause: z.string().max(MAKS_CONTEXT_VERDI).optional(),
});

export const logInfoSchema = z
    .object({
        level: z.enum(["debug", "info", "warn", "error"]),
        message: z.string().max(MAKS_MELDING),
        correlationId: z.string().max(100).optional(),
        context: z.record(z.string(), contextVerdi).optional(),
        error: loggetFeilSchema.optional(),
    })
    .refine((payload) => Object.keys(payload.context ?? {}).length <= MAKS_CONTEXT_NØKLER, {
        message: `context kan ha maks ${MAKS_CONTEXT_NØKLER} nøkler`,
        path: ["context"],
    });

export type ValidertLogInfo = z.infer<typeof logInfoSchema>;
