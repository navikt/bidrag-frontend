import { correlationIdHeader, generateCorrelationId } from "@bidrag/common";
import type { Route } from "../../+types/root.ts";
import { kjørMedLoggerKontekst } from "./loggerContext.ts";

/**
 * Åpner logg-konteksten for requesten. Må ligge først i middleware-kjeden, slik at også
 * autentiseringsfeil kan spores tilbake til ID-en brukeren ser.
 *
 * Klientens `X-Correlation-ID` er autoritativ når den finnes, slik at ID-en henger sammen på tvers
 * av nettleser, proxy og backend.
 */
export const loggerMiddleware: Route.MiddlewareFunction = ({ request }, next) => {
    const correlationId = request.headers.get(correlationIdHeader) ?? generateCorrelationId();

    // next() må kalles inne i scopet. Kalles den utenfor, tapes konteksten stille.
    return kjørMedLoggerKontekst({ correlationId }, () => next());
};
