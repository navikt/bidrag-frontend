/**
 * biome-ignore-all lint/complexity/noThisInStatic: `this` er nødvendig for at
 * LoggerService og SecureLoggerService skal kunne overstyre `log()`. Byttes det
 * til klassenavnet, kalles alltid stubben under og all logging går tapt.
 */


import { CustomError } from "../types";
import { beskrivCause } from "./beskrivCause.ts";
import { correlationIdHeader } from "./correlationId.utils.ts";
import type { LogContext, LogErrorType, LoggetFeil, LogInfo, LogLevel } from "./log.types.ts";

/** Feilformer vi godtar fra kallstedene. Beholdt for å ikke bryte 200+ kallsteder. */
type FeilInput = LogErrorType | (Partial<LoggetFeil> & { correlationId?: string | null; cause?: unknown });

// biome-ignore lint/complexity/noStaticOnlyClass: Basisklasse med statisk API som LoggerService og SecureLoggerService arver
export abstract class AbstractLoggerService {
    static info(msg: string, context?: LogContext): Promise<void> {
        return this.mapAndLog(msg, "info", undefined, context);
    }

    static feedback(msg: string, context?: LogContext): Promise<void> {
        // Tilbakemelding er ikke en alvorlighetsgrad, men en hendelsestype.
        return this.mapAndLog(msg, "info", undefined, { ...context, kind: "feedback" });
    }

    static warn(msg: string, error?: FeilInput, context?: LogContext): Promise<void> {
        return this.mapAndLog(msg, "warn", error, context);
    }

    static error(msg: string, error?: FeilInput, context?: LogContext): Promise<void> {
        return this.mapAndLog(msg, "error", error, context);
    }

    static debug(msg: string, context?: LogContext): Promise<void> {
        return this.mapAndLog(msg, "debug", undefined, context);
    }

    protected static log(_logInfo: LogInfo, _headers?: Record<string, string>): Promise<void> {
        throw new Error("Not implemented");
    }

    protected static async mapAndLog(
        message: string,
        level: LogLevel,
        error?: FeilInput,
        context?: LogContext,
    ): Promise<void> {
        try {
            const { feil, correlationId } = this.normaliserFeil(error);
            const carrier: Record<string, string> = {};
            if (correlationId) {
                carrier[correlationIdHeader] = correlationId;
            }
            const logInfo: LogInfo = {
                level,
                message,
                correlationId,
                context,
                error: feil,
            };
            await this.log(logInfo, carrier);
        } catch (e) {
            // Logging skal aldri velte kallstedet.
            console.error("Klarte ikke å logge", e);
        }
    }

    protected static normaliserFeil(error?: FeilInput): {
        feil?: LoggetFeil;
        correlationId?: string;
    } {
        if (!error) {
            return {};
        }

        if (error instanceof Error) {
            const feil: LoggetFeil = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: beskrivCause(error.cause),
            };
            // ReactError og liknende bærer komponenttreet i et eget felt.
            const componentStack = (error as { componentStack?: unknown }).componentStack;
            if (typeof componentStack === "string" && componentStack.trim()) {
                feil.componentStack = componentStack;
            }
            if (error instanceof CustomError) {
                feil.status = error.status;
                return { feil, correlationId: error.correlationId ?? undefined };
            }
            return { feil };
        }

        const feil: LoggetFeil = {
            name: error.name ?? "UnknownError",
            message: error.message ?? "Ukjent feil",
            stack: error.stack,
            componentStack: error.componentStack,
            status: error.status,
            cause: beskrivCause(error.cause),
        };
        return { feil, correlationId: error.correlationId ?? undefined };
    }
}
