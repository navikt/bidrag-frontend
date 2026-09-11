import { correlationIdHeader, generateCorrelationId } from "@bidrag/common";
import type { Route } from "../../+types/root.ts";
import { kjørMedLoggerKontekst } from "./loggerContext.ts";

/**
 * Åpner logg-konteksten for requesten. Må ligge først i middleware-kjeden, slik at også
 * autentiseringsfeil kan spores tilbake til ID-en brukeren ser.
 *
 */
export const loggerMiddleware: Route.MiddlewareFunction = ({ request }, next) => {
    const raw = request.headers.get(correlationIdHeader)?.trim();
    // sjekker for å unngå injection
    const erGyldig = !!raw && raw.length < 20 && /^[\w-]+$/.test(raw);
    const correlationId = erGyldig ? raw : generateCorrelationId();

    // next() må kalles inne i scopet. Kalles den utenfor, tapes konteksten stille.
    return kjørMedLoggerKontekst({ correlationId }, () => next());
};
