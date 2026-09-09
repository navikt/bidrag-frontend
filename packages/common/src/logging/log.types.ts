import type { CustomError, SimpleError } from "../types/error";

/** Samme navn som pino-metodene, slik at `logger[level](...)` kan brukes direkte. */
export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, string | number | boolean | null>;

export interface LogInfo {
    level: LogLevel;
    message: string;
    correlationId?: string;
    context?: LogContext;
    error?: LoggetFeil;
}

export interface LoggetFeil {
    name: string;
    message: string;
    /** JS-stacktrace på formen `at fn (fil:linje:kolonne)`. Symbolikeres på serveren. */
    stack?: string;
    /** React-komponenttre. Annet format enn `stack`, og symbolikeres derfor ikke. */
    componentStack?: string;
    status?: number;
    /**
     * Tekstlig beskrivelse av underliggende årsak.
     *
     * 🔴 Aldri et objekt: en `AxiosError` bærer med seg `config.data` (request-bodyen,
     * som kan inneholde fødselsnummer) og `config.headers` (med `Authorization`).
     * Se `beskrivCause()` i `AbstractLoggerService`.
     */
    cause?: string;
}

export type LogErrorType = Error | CustomError | SimpleError;
