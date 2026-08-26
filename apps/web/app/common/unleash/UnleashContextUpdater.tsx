import { getBisysSessionParams } from "@bidrag/common";
import { useUnleashContext } from "@unleash/proxy-client-react";
import { useEffect, useState } from "react";
import { useMatches, useSearchParams } from "react-router";

type SaksnummerProperty = { saksnummer?: string };

/**
 * Holder Unleash-konteksten oppdatert med saksnummer og enhet, slik at feature
 * toggles kan skrus på for enkeltsaker eller enkelte enheter i Unleash.
 *
 * Bruk `properties.saksnummer` / `properties.enhet` i strategiene i Unleash.
 * userId (NAVident) settes på serversiden i proxy-ruta, og kan ikke overstyres
 * av klienten.
 */
export function UnleashContextUpdater() {
    const updateContext = useUnleashContext();
    const matches = useMatches();
    const [searchParams] = useSearchParams();
    const [enhet, setEnhet] = useState<string | undefined>();

    const saksnummer = matches.reduce<string | undefined>(
        (foundString, match) => (match.params as SaksnummerProperty).saksnummer ?? foundString,
        undefined,
    );

    // enhet ligger i sessionStorage (satt av bisys-parametere), som kun finnes i nettleseren
    useEffect(() => {
        setEnhet(getBisysSessionParams(searchParams).enhet ?? undefined);
    }, [searchParams]);

    useEffect(() => {
        void updateContext({
            properties: {
                ...(saksnummer ? { saksnummer } : {}),
                ...(enhet ? { enhet } : {}),
            },
        });
    }, [updateContext, saksnummer, enhet]);

    return null;
}
