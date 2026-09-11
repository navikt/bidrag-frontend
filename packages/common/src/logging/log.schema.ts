import { z } from "zod";

/**
 * Skjema for det klienten sender til `/log`.
 */

const MAKS_MELDING = 4_000;
const MAKS_STACK = 20_000;
const MAKS_CONTEXT_NØKLER = 30;
const MAKS_CONTEXT_VERDI = 500;

// Godtar hva som helst her — normalisering/serialisering skjer i normaliserLogInfo.
const contextVerdi = z.unknown();

const loggetFeilSchema = z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
    componentStack: z.string().optional(),
    status: z.number().int().optional(),
    cause: z.string().optional(),
});

export const logInfoSchema = z.object({
    level: z.enum(["debug", "info", "warn", "error"]).catch("warn"),
    message: z.string(),
    context: z.record(z.string(), contextVerdi).optional(),
    error: loggetFeilSchema.optional(),
});

const kutt = (verdi: string, maks: number) => (verdi.length > maks ? verdi.slice(0, maks) : verdi);

/** Gjør en vilkårlig context-verdi om til noe pino/JSON kan håndtere trygt, med lengdebegrensning. */
function normaliserContextVerdi(verdi: unknown): string | number | boolean | null {
    if (verdi === null || typeof verdi === "number" || typeof verdi === "boolean") return verdi;

    if (typeof verdi === "string") return kutt(verdi, MAKS_CONTEXT_VERDI);

    // undefined, objekter, arrays, Date, Error o.l. -> forsøk JSON.stringify som fallback.
    try {
        const json = JSON.stringify(verdi) ?? String(verdi);
        return kutt(json, MAKS_CONTEXT_VERDI);
    } catch {
        // Sirkulære referanser e.l. -> siste utvei.
        return kutt(String(verdi), MAKS_CONTEXT_VERDI);
    }
}

/**
 * Normaliserer et allerede type-validert logg-objekt slik at det overholder
 * lengdebegrensningene i spec (kutter strenger, serialiserer ukjente context-verdier
 * og begrenser antall context-nøkler), i stedet for å avvise hele payloaden.
 */
export function normaliserLogInfo(payload: ValidertLogInfo) {
    const context = payload.context
        ? Object.fromEntries(
              Object.entries(payload.context)
                  .slice(0, MAKS_CONTEXT_NØKLER)
                  .map(([nøkkel, verdi]) => [nøkkel, normaliserContextVerdi(verdi)]),
          )
        : payload.context;

    const error = payload.error
        ? {
              ...payload.error,
              name: kutt(payload.error.name, 200),
              message: kutt(payload.error.message, MAKS_MELDING),
              stack: payload.error.stack !== undefined ? kutt(payload.error.stack, MAKS_STACK) : undefined,
              componentStack:
                  payload.error.componentStack !== undefined
                      ? kutt(payload.error.componentStack, MAKS_STACK)
                      : undefined,
              cause: payload.error.cause !== undefined ? kutt(payload.error.cause, MAKS_CONTEXT_VERDI) : undefined,
          }
        : payload.error;

    return {
        ...payload,
        message: kutt(payload.message, MAKS_MELDING),
        context,
        error,
    };
}

export const normalisertLogInfoSchema = logInfoSchema.transform(normaliserLogInfo);

export type ValidertLogInfo = z.infer<typeof logInfoSchema>;
