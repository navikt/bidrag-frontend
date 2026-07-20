import { type LogInfo, LogLevel, type LogResponse } from "@bidrag/common";
import type pino from "pino";
import { env } from "~/env.server.ts";
import { userContext } from "~/server/auth/auth.context";
import exceptionToErrorCode from "~/server/logger/utils/ExceptionHasher";
import { symbolicateStackTrace } from "~/server/logger/utils/SymbolicateStackTrace";
import type { Route } from "./+types/logRoute.ts";
import { navLogger, secureNavLogger } from "./navLogger";

export async function action({ params, request, context }: Route.ActionArgs) {
    const { type } = params;
    const isSecureLog = type === "secure";
    const logger = isSecureLog ? secureNavLogger : navLogger;

    const user = context.get(userContext);
    return doLog(logger, request, user?.NAVident ?? "ukjent");
}

async function doLog(
    loggerInstance: pino.Logger,
    req: Request,
    user: string,
): Promise<LogResponse> {
    const payload: LogInfo = await req.json();
    const {
        moduleName,
        appName = "bidrag-frontend",
        level,
        error,
        message,
        correlationId,
    } = payload;
    const errorPayload = error as LogInfo["error"] & {
        stack?: string;
        stackTrace?: string;
        componentStack?: string;
    };
    const rawStackTrace = [
        error?.stack_trace,
        errorPayload?.stackTrace,
        errorPayload?.stack,
    ]
        .filter((value): value is string => Boolean(value?.trim()))
        .join("\n")
        .trim();
    const componentStack = errorPayload?.componentStack?.trim();
    const errorType = error?.errorType ?? "UnknownError";
    const { symbolicatedStackTrace, didSymbolicate, debug } =
        await symbolicateStackTrace(rawStackTrace);
    const resolvedStackTrace = symbolicatedStackTrace || rawStackTrace;

    let metadata: any =
        level === LogLevel.FEEDBACK
            ? {
                  module: `${appName}/${moduleName}`,
              }
            : {
                  module: `${appName}/${moduleName}`,
                  user,
                  // sessionId: req.session.sessionId,
                  correlationId: correlationId, //?? getCorrelationIdFromThread(),
              };

    if (error) {
        metadata = {
            ...metadata,
            stack_trace: resolvedStackTrace,
            component_stack: componentStack,
            stack_trace_symbolicated: didSymbolicate,
            stack_trace_symbolication_debug:
                env.NODE_ENV === "development" ? debug : undefined,
            errorType,
            status: error.status ?? 500,
            cause: error.cause ?? "unknown",
        };
    }

    const logResponse: LogResponse = {} as LogResponse;
    switch (level) {
        case LogLevel.FEEDBACK:
        case LogLevel.INFO:
            loggerInstance.info(metadata, message);
            break;
        case LogLevel.WARNING:
            loggerInstance.warn(metadata, message);
            break;
        case LogLevel.DEBUG: {
            if (env.NODE_ENV === "development") {
                loggerInstance.debug(metadata, message);
            }
            break;
        }
        case LogLevel.ERROR: {
            if (!error) {
                loggerInstance.error(
                    metadata,
                    `Det skjedde en teknisk feil i applikasjonen ${appName}: ${message}`,
                );
                break;
            }
            const { errorCode, exceptionCode } = await exceptionToErrorCode(
                resolvedStackTrace || "ukjent",
                appName,
            );

            const errorMetadata = {
                ...metadata,
                errorCode,
                exceptionCode,
            };

            logResponse.errorCode = errorCode;
            logResponse.exceptionCode = exceptionCode;

            loggerInstance.error(
                errorMetadata,
                `Det skjedde en teknisk feil i applikasjonen ${appName}/${moduleName} med feilkode ${errorCode}: ${message}`,
            );
        }
    }
    return logResponse;
}
