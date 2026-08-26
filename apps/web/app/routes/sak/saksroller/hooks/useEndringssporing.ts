import { useEffect, useRef } from "react";

import { lagEndringsoppsummering } from "../Endringsoppsummering.tsx";
import type { SakRedigeringData } from "../sakvisning-schema.ts";

type Props = {
    opprinneligeRoller: SakRedigeringData["roller"];
    nåværendeRoller: SakRedigeringData["roller"];
    barnMedUfullstendigRelasjon: string[];
    dataOppdatertNøkkel: unknown;
    onNyEndring: () => void;
};

function lagRolleEndringSignaturUtenAdvarsel(endringsliste: ReturnType<typeof lagEndringsoppsummering>): string {
    return JSON.stringify(endringsliste.map(({ harUfullstendigRelasjon, ...rolleEndring }) => rolleEndring));
}

export function skalRapportereEndring(harEndringer: boolean, hopperOverTilbakestilling: boolean): boolean {
    return !hopperOverTilbakestilling || harEndringer;
}

export function useEndringssporing({
    opprinneligeRoller,
    nåværendeRoller,
    barnMedUfullstendigRelasjon,
    dataOppdatertNøkkel,
    onNyEndring,
}: Props) {
    const endringsliste = lagEndringsoppsummering(opprinneligeRoller, nåværendeRoller, barnMedUfullstendigRelasjon);
    const harEndringer = endringsliste.length > 0;
    const rolleEndringSignatur = lagRolleEndringSignaturUtenAdvarsel(endringsliste);

    const forrigeSignaturRef = useRef<string | null>(null);
    const forrigeDataNøkkelRef = useRef(dataOppdatertNøkkel);
    const hoppOverPåfølgendeTilbakestillingRef = useRef(false);

    function oppdagOgRapporterEndring() {
        const dataNettopOppdatert = dataOppdatertNøkkel !== forrigeDataNøkkelRef.current;
        forrigeDataNøkkelRef.current = dataOppdatertNøkkel;

        if (dataNettopOppdatert) {
            forrigeSignaturRef.current = rolleEndringSignatur;
            hoppOverPåfølgendeTilbakestillingRef.current = true;
            return;
        }

        if (forrigeSignaturRef.current === null) {
            forrigeSignaturRef.current = rolleEndringSignatur;
            return;
        }

        if (rolleEndringSignatur === forrigeSignaturRef.current) {
            hoppOverPåfølgendeTilbakestillingRef.current = false;
            return;
        }

        forrigeSignaturRef.current = rolleEndringSignatur;

        if (hoppOverPåfølgendeTilbakestillingRef.current) {
            hoppOverPåfølgendeTilbakestillingRef.current = false;
            if (skalRapportereEndring(harEndringer, true)) {
                onNyEndring();
            }
            return;
        }

        onNyEndring();
    }

    useEffect(oppdagOgRapporterEndring, [rolleEndringSignatur, dataOppdatertNøkkel, onNyEndring]);

    return { endringsliste, harEndringer };
}
