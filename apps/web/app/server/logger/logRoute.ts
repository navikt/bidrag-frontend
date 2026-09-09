import { type LoggetFeil, logInfoSchema } from "@bidrag/common";
import { env } from "~/env.server.ts";
import { symbolicateStackTrace } from "~/server/logger/utils/SymbolicateStackTrace";
import type { Route } from "./+types/logRoute.ts";
import { navLogger, secureNavLogger } from "./navLogger";

type Logger = typeof navLogger;

export async function action({ params, request }: Route.ActionArgs) {
    const { type } = params;
    const isSecureLog = type === "secure";

    return doLog(isSecureLog ? secureNavLogger : navLogger, request);
}

/**
 * Symbolikerer kun JS-stacktracen. `componentStack` har et annet format
 * (komponentnavn uten fil, linje og kolonne) og ville gitt bare bomtreff.
 */
async function symbolikerFeil(feil: LoggetFeil) {
    if (!feil.stack?.trim()) {
        return { stack: feil.stack, symbolikert: false, debug: undefined };
    }
    const { symbolicatedStackTrace, didSymbolicate, debug } = await symbolicateStackTrace(feil.stack);
    return {
        stack: symbolicatedStackTrace || feil.stack,
        symbolikert: didSymbolicate,
        debug: env.NODE_ENV === "development" ? debug : undefined,
    };
}

async function doLog(logger: Logger, req: Request): Promise<Response> {
    const resultat = logInfoSchema.safeParse(await req.json().catch(() => null));

    if (!resultat.success) {
        // Innholdet logges bevisst ikke — det er nettopp det vi ikke stoler på.
        logger.warn({ feil: resultat.error.issues.map((i) => i.path.join(".")) }, "Ugyldig loggpayload avvist");
        return new Response(null, { status: 400 });
    }

    const { level, message, correlationId, context, error } = resultat.data;

    if (level === "debug" && env.NODE_ENV !== "development") {
        return new Response(null, { status: 204 });
    }

    // `correlationId` og `user` kommer fra request-konteksten. ID-en fra payloaden
    // gjelder feilen i nettleseren, og overstyrer derfor bevisst.
    const felter: Record<string, unknown> = {
        ...context,
        ...(correlationId ? { correlationId } : {}),
        ...(context?.kind === "feedback" ? { user: undefined } : {}),
    };

    if (error) {
        const { stack, symbolikert, debug } = await symbolikerFeil(error);
        felter.err = { ...error, stack };
        felter.stack_symbolicated = symbolikert;
        if (debug) {
            felter.stack_symbolication_debug = debug;
        }
    }

    logger[level](felter, message);

    return new Response(null, { status: 204 });
}
