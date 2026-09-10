import { maskerFnr } from "@bidrag/common/logging/maskerFnr";
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

type Loggkall = {
    obj: unknown;
    args: unknown[];
};

/**
 * Maskerer fødselsnummer i hele loggkallet.
 *
 * Både første argument og resten må gjennom. Pino-signaturen er `log(obj, melding)`, og
 * meldingen er i praksis den vanligste lekkasjeveien — `log.error(`Fant ikke ${fnr}`)`
 * har ikke noe objekt i det hele tatt.
 *
 * Antall treff legges på som `maskert_fnr`, slik at vi kan alarmere på kallsteder som
 * lekker i stedet for bare å skjule dem.
 */
function maskerLoggkall({ obj, args }: Loggkall): Loggkall {
    const maskertObj = maskerFnr(obj);
    const maskerteArgs = args.map((arg) => maskerFnr(arg));
    const antall = maskertObj.antall + maskerteArgs.reduce((sum, a) => sum + a.antall, 0);

    if (antall === 0) {
        return { obj, args };
    }

    const verdier = maskerteArgs.map((a) => a.verdi);

    // Telemetrifeltet må ligge på et objekt. Er første argument en streng, er den selve
    // meldingen, og da skyves den bakover slik at pino fortsatt tolker kallet riktig.
    if (typeof maskertObj.verdi === "string" || maskertObj.verdi === undefined) {
        const melding = maskertObj.verdi;
        return {
            obj: { maskert_fnr: antall },
            args: melding === undefined ? verdier : [melding, ...verdier],
        };
    }

    return {
        obj: { ...(maskertObj.verdi as object), maskert_fnr: antall },
        args: verdier,
    };
}

type Loggmetoder = Pick<Logger, Nivå>;

type NavLogger = Loggmetoder & {
    level: string;
    child: (bindings: Bindings) => NavLogger;
};

type Innstillinger = {
    /**
     * Maskerer fødselsnummer før loggen skrives.
     *
     * Av for securelog: teamloggen er det sanksjonerte stedet for sensitive data, med
     * strengere tilgangsstyring og kortere lagringstid. Maskering der ville fjernet det
     * eneste verktøyet for identspesifikk feilsøking.
     */
    masker: boolean;
};

function lagLogger(mål: readonly Logger[], innstillinger: Innstillinger): NavLogger {
    const metoder = {} as Record<Nivå, (obj: unknown, ...args: unknown[]) => void>;

    for (const nivå of NIVÅER) {
        metoder[nivå] = (obj: unknown, ...args: unknown[]) => {
            // Pino filtrerer selv på nivå, men da hadde vi betalt for maskering av logger
            // som uansett forkastes. Proxyen kaller `trace` på hvert eneste kall.
            if (!mål.some((mållogger) => mållogger.isLevelEnabled?.(nivå) ?? true)) {
                return;
            }

            const beriket = medAmbientFelter(obj);
            const kall = innstillinger.masker ? maskerLoggkall({ obj: beriket, args }) : { obj: beriket, args };

            for (const mållogger of mål) {
                (mållogger[nivå] as (obj: unknown, ...args: unknown[]) => void)(kall.obj, ...kall.args);
            }
        };
    }

    return {
        ...(metoder as Loggmetoder),
        level: mål[0]?.level ?? "info",
        // Innstillingene må følge med, ellers begynner avledede loggere stille å maskere.
        child: (bindings: Bindings) =>
            lagLogger(
                mål.map((mållogger) => mållogger.child(bindings)),
                innstillinger,
            ),
    };
}

/** Logger til både vanlig logg og teamlogg. Ambient felter og fnr-maskering legges på automatisk. */
export const navLogger = lagLogger([logger, teamLogger as Logger], { masker: true });

/**
 * Kun teamlogg (securelog), for innhold som ikke skal i den vanlige loggen.
 * Maskeres ikke — bruk denne bevisst når identer faktisk må logges.
 */
export const secureNavLogger = lagLogger([teamLogger as Logger], { masker: false });
