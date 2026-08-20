import type { Context as UnleashContext } from "unleash-client";

export const UNLEASH_APP_NAME = "bidrag-frontend";

export type { UnleashContext };

/** Egenskaper klienten får lov til å sende inn. Alt annet ignoreres. */
const TILLATTE_PROPERTIES = ["saksnummer", "enhet"] as const;

/**
 * Bygger Unleash-konteksten for en forespørsel fra nettleseren.
 *
 * userId settes alltid fra innlogget saksbehandler på serveren – vi stoler ikke på
 * identitet sendt fra nettleseren. saksnummer og enhet er navigasjonskontekst fra
 * klienten (unleash-proxy-client sender dem som `properties[...]`).
 */
export function byggUnleashContext(url: URL, navIdent: string | undefined): UnleashContext {
    const properties: Record<string, string> = {};

    for (const key of TILLATTE_PROPERTIES) {
        const verdi = url.searchParams.get(`properties[${key}]`);
        if (verdi) {
            properties[key] = verdi;
        }
    }

    if (navIdent) {
        properties.NAVident = navIdent;
    }

    return {
        userId: navIdent,
        sessionId: url.searchParams.get("sessionId") ?? undefined,
        appName: UNLEASH_APP_NAME,
        properties,
    };
}
