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

/**
 * Sender en ekte `Error`-instans videre til Faro, hvis den er initialisert.
 *
 * Faro eksponerer seg selv på `window.faro` som standard (`preventGlobalExposure`
 * er ikke satt i `apps/web/app/faro.client.ts`). Vi leser den globalen direkte i
 * stedet for å registrere en hook via `apps/web` — ingen `root.tsx`-kobling
 * trengs, og apper uten Faro (eller uten nettleser) er en ren no-op. Selve
 * `Window.faro`-typen er deklarert ett sted, i `../windowTypes.ts`.
 */
function pushErrorTilFaro(feil: Error, kontekst: Record<string, string>) {
    const faro = typeof window !== "undefined" ? window.faro : undefined;
    faro?.api.pushError(feil, { context: kontekst });
}

// biome-ignore lint/complexity/noStaticOnlyClass: Basisklasse med statisk API som LoggerService og SecureLoggerService arver
export abstract class AbstractLoggerService {
    /**
     * Overstyres av `SecureLoggerService` (satt til `false`). Sikker logg skal
     * aldri havne i telemetri, uavhengig av om Faro er initialisert.
     */
    protected static readonly rapporterTilTelemetri: boolean = true;

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
                context,
                error: feil,
            };

            // Kun ekte `Error`-instanser gir en brukbar stack til Faros stacktrace-parser.
            // Objektformen (`SimpleError`/`CustomError`-literaler) har ingen egen stack å tilby.
            if (this.rapporterTilTelemetri && error instanceof Error) {
                try {
                    pushErrorTilFaro(error, this.telemetriKontekst(message, correlationId, context));
                } catch (e) {
                    console.error("Klarte ikke å pushe feil til Faro", e);
                }
            }
            await this.log(logInfo, carrier);
        } catch (e) {
            console.error("Klarte ikke å logge", e);
        }
    }

    private static telemetriKontekst(
        message: string,
        correlationId?: string,
        context?: LogContext,
    ): Record<string, string> {
        const kontekst: Record<string, string> = { logMessage: message };
        if (correlationId) {
            kontekst.correlationId = correlationId;
        }
        for (const [key, value] of Object.entries(context ?? {})) {
            if (value !== null) {
                kontekst[key] = String(value);
            }
        }
        return kontekst;
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
