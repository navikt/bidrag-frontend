import { type LoggetFeil, logInfoSchema } from "@bidrag/common";
import { env } from "~/env.server.ts";
import type { Route } from "./+types/logRoute.ts";
import { navLogger, secureNavLogger } from "./navLogger";

type Logger = typeof navLogger;

export async function action({ params, request }: Route.ActionArgs) {
    const { type } = params;
    const isSecureLog = type === "secure";

    return doLog(isSecureLog ? secureNavLogger : navLogger, request);
}

async function doLog(logger: Logger, req: Request): Promise<Response> {
    const resultat = logInfoSchema.safeParse(await req.json().catch(() => null));

    if (!resultat.success) {
        // Innholdet logges bevisst ikke — det er nettopp det vi ikke stoler på.
        logger.warn({ feil: resultat.error.issues.map((i) => i.path.join(".")) }, "Ugyldig loggpayload avvist");
        return new Response(null, { status: 400 });
    }

    const { level, message, context, error } = resultat.data;

    const felter: Record<string, unknown> = {
        ...context,
        ...(context?.kind === "feedback" ? { user: undefined } : {}),
        ...(error ? { err: error } : {}),

    };

    logger[level](felter, message);

    return new Response(null, { status: 204 });
}
