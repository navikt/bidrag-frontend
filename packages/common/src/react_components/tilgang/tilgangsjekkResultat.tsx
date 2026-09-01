import type { TilgangskontrollResponse } from "@bidrag/api/TilgangskontrollApi";
import type { ReactNode } from "react";
import { BidragProgressbar } from "../BidragProgressbar.tsx";
import { type PartialAlertProps, TilgangLocalAlert } from "./TilgangLocalAlert.tsx";

export interface TilgangssjekkResultat {
    harTilgang: boolean;
    TilgangAlert: (props: PartialAlertProps) => ReactNode;
}

export interface TilgangssjekkQueryResultat {
    data: TilgangskontrollResponse | undefined;
    isError: boolean;
    isPending: boolean;
}

/** Delt logikk for person- og saks-tilgangssjekk. Brukes kun internt av useTilgangssjekkPerson/useTilgangssjekkSak. */
export function tilgangssjekkResultat(
    queryResult: TilgangssjekkQueryResultat,
    subjekt: string,
    manglendeTilgangTittel: string,
): TilgangssjekkResultat {
    const { data, isError, isPending } = queryResult;

    if (isPending) {
        return {
            harTilgang: false,
            TilgangAlert: () => (
                <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center">
                    <BidragProgressbar />
                </div>
            ),
        };
    }

    if (isError) {
        console.warn(`Kunne ikke gjøre tilgangskontroll for ${subjekt}. Prøver å vise resultat allikevel`);
        return { harTilgang: true, TilgangAlert: () => null };
    }

    if (data?.harTilgang) {
        return { harTilgang: true, TilgangAlert: () => null };
    }

    return {
        harTilgang: false,
        TilgangAlert: (props: PartialAlertProps) => (
            <TilgangLocalAlert title={manglendeTilgangTittel} tilgangResultat={data} {...props} />
        ),
    };
}
