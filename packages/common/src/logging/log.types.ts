import type { CustomError, SimpleError } from "../types/error";

/** Samme navn som pino-metodene, slik at `logger[level](...)` kan brukes direkte. */
export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, string | number | boolean | null>;

export interface LogInfo {
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: LoggetFeil;
}

export interface LoggetFeil {
    name: string;
    message: string;
    /** React-komponenttre. Annet format enn `stack`, og symbolikeres derfor ikke. */
    componentStack?: string;
    status?: number;
    cause?: string;
}

export type LogErrorType = Error | CustomError | SimpleError;
