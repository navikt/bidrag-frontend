import { logger } from "@navikt/pino-logger";
import { teamLogger } from "@navikt/pino-logger/team-log";
import type { Bindings, Logger } from "pino";
import { hentRequestKontekst } from "./loggerContext.ts";

const NIVÅER = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

type Nivå = (typeof NIVÅER)[number];

/**
 * Slår `correlationId` og `user` fra den aktive requesten inn i loggobjektet.
 *
 * Feltene slås inn per kall, ikke når loggeren opprettes, fordi `user` fylles inn av
 * authMiddleware etter at konteksten er åpnet.
 */
function medAmbientFelter(arg: unknown): unknown {
    const ambient = hentRequestKontekst();

    // pino tolker en ren streng som selve meldingen — den skal slippe gjennom urørt.
    if (arg === undefined || typeof arg === "string") {
        return arg;
    }
    // Pakkes som `err` slik at pinos innebygde serializer beholder stacktracen.
    if (arg instanceof Error) {
        return { ...ambient, err: arg };
    }

    // Eksplisitte felter spres sist, slik at kallstedet kan overstyre ambient kontekst.
    return { ...ambient, ...(arg as object) };
}

type Loggmetoder = Pick<Logger, Nivå>;

type NavLogger = Loggmetoder & {
    level: string;
    child: (bindings: Bindings) => NavLogger;
};

function lagLogger(mål: readonly Logger[]): NavLogger {
    const metoder = {} as Record<Nivå, (obj: unknown, ...args: unknown[]) => void>;

    for (const nivå of NIVÅER) {
        metoder[nivå] = (obj: unknown, ...args: unknown[]) => {
            const beriket = medAmbientFelter(obj);
            for (const mållogger of mål) {
                (mållogger[nivå] as (obj: unknown, ...args: unknown[]) => void)(beriket, ...args);
            }
        };
    }

    return {
        ...(metoder as Loggmetoder),
        level: mål[0]?.level ?? "info",
        child: (bindings: Bindings) => lagLogger(mål.map((mållogger) => mållogger.child(bindings))),
    };
}

/** Logger til både vanlig logg og teamlogg. Ambient felter legges på automatisk. */
export const navLogger = lagLogger([logger, teamLogger as Logger]);

/** Kun teamlogg (securelog), for innhold som ikke skal i den vanlige loggen. */
export const secureNavLogger = lagLogger([teamLogger as Logger]);
