import { type LogInfo, LogLevel, type LogResponse } from "@bidrag/common";
import { env } from "~/env.server.ts";
import exceptionToErrorCode from "~/server/logger/utils/ExceptionHasher";
import { symbolicateStackTrace } from "~/server/logger/utils/SymbolicateStackTrace";
import type { Route } from "./+types/logRoute.ts";
import { navLogger, secureNavLogger } from "./navLogger";

export async function action({ params, request }: Route.ActionArgs) {
    const { type } = params;
    const isSecureLog = type === "secure";

    return doLog(isSecureLog ? secureNavLogger : navLogger, request);
}

type Logger = typeof navLogger;

async function doLog(logger: Logger, req: Request): Promise<LogResponse> {
    const payload: LogInfo = await req.json();
    const { moduleName, appName = "bidrag-frontend", level, error, message } = payload;
    const errorPayload = error as LogInfo["error"] & {
        stack?: string;
        stackTrace?: string;
        componentStack?: string;
    };
    const rawStackTrace = [error?.stack_trace, errorPayload?.stackTrace, errorPayload?.stack]
        .filter((value): value is string => Boolean(value?.trim()))
        .join("\n")
        .trim();
    const componentStack = errorPayload?.componentStack?.trim();
    const errorType = error?.errorType ?? "UnknownError";
    const { symbolicatedStackTrace, didSymbolicate, debug } = await symbolicateStackTrace(rawStackTrace);
    const resolvedStackTrace = symbolicatedStackTrace || rawStackTrace;

    // `correlationId` og `user` kommer fra request-konteksten. Her overstyres de bevisst:
    // ID-en fra payloaden gjelder feilen i nettleseren, og tilbakemeldinger logges uten NAV-ident.
    let metadata: Record<string, unknown> = {
        module: `${appName}/${moduleName}`,
        ...(payload.correlationId ? { correlationId: payload.correlationId } : {}),
        ...(level === LogLevel.FEEDBACK ? { user: undefined } : {}),
    };

    if (error) {
        metadata = {
            ...metadata,
            stack_trace: resolvedStackTrace,
            component_stack: componentStack,
            stack_trace_symbolicated: didSymbolicate,
            stack_trace_symbolication_debug: env.NODE_ENV === "development" ? debug : undefined,
            errorType,
            status: error.status ?? 500,
            cause: error.cause ?? "unknown",
        };
    }

    const logResponse: LogResponse = {} as LogResponse;
    switch (level) {
        case LogLevel.FEEDBACK:
        case LogLevel.INFO:
            logger.info(metadata, message);
            break;
        case LogLevel.WARNING:
            logger.warn(metadata, message);
            break;
        case LogLevel.DEBUG: {
            if (env.NODE_ENV === "development") {
                logger.debug(metadata, message);
            }
            break;
        }
        case LogLevel.ERROR: {
            if (!error) {
                logger.error(metadata, `Det skjedde en teknisk feil i applikasjonen ${appName}: ${message}`);
                break;
            }
            //TODO fjerne errorCode og exceptionCode da de ikke brukes
            const { errorCode, exceptionCode } = await exceptionToErrorCode(resolvedStackTrace || "ukjent", appName);

            const errorMetadata = {
                ...metadata,
                errorCode,
                exceptionCode,
            };

            logResponse.errorCode = errorCode;
            logResponse.exceptionCode = exceptionCode;

            logger.error(
                errorMetadata,
                `Det skjedde en teknisk feil i applikasjonen ${appName}/${moduleName} med feilkode ${errorCode}: ${message}`,
            );
        }
    }
    return logResponse;
}
