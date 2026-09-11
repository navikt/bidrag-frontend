import { type logInfoSchema, normalisertLogInfoSchema } from "@bidrag/common";
import type { z } from "zod";
import type { Route } from "./+types/logRoute.ts";
import { navCombinedLogger, secureNavLogger } from "./navLogger.ts";

type Logger = typeof navCombinedLogger;

export async function action({ params, request }: Route.ActionArgs) {
    const { type } = params;
    const isSecureLog = type === "secure";

    return doLog(isSecureLog ? secureNavLogger : navCombinedLogger, request);
}
type LoggetFeilData = NonNullable<z.infer<typeof logInfoSchema>["error"]>;
/** Gjenoppbygger en ekte Error slik at pinos `err`-serializer får riktig `type`, stack osv. */
function tilError(feil: LoggetFeilData): Error {
    // Dynamisk klassenavn -> e.constructor.name === feil.type
    const NavngittError = { [feil.name]: class extends Error {} }[feil.name] ?? Error;
    const error = new NavngittError(feil.message);
    error.name = feil.name;
    error.stack = feil.stack ?? feil.componentStack;
    Object.assign(error, {
        cause: feil.cause,
        status: feil.status,
        componentStack: feil.componentStack,
    });
    return error;
}

async function doLog(logger: Logger, req: Request): Promise<Response> {
    const logRequest = await req.json().catch(() => null);
    const resultat = normalisertLogInfoSchema.safeParse(logRequest);

    if (!resultat.success) {
        // Innholdet logges bevisst ikke — det er nettopp det vi ikke stoler på.
        logger.warn({ feil: resultat.error.issues.map((i) => i.path.join(".")) }, "Ugyldig loggpayload avvist");
        return new Response(null, { status: 400 });
    }

    const { level, message, context, error } = resultat.data;

    const klientfelter = Object.fromEntries(
        Object.entries(context ?? {}).filter(([nøkkel]) => nøkkel !== "user" && nøkkel !== "correlationId"),
    );

    const felter: Record<string, unknown> = {
        ...klientfelter,
        ...(error ? { err: tilError(error) } : {}),
    };

    logger[level](felter, message);

    return new Response(null, { status: 204 });
}
