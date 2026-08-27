import {ReactNode} from "react";
import {useQuery} from "@tanstack/react-query";
import {sjekkTilgangPerson, sjekkTilgangSak} from "../../api";
import {TilgangLocalAlert} from "./TilgangLocalAlert.tsx";

interface TilgangssjekkResultat {
    harTilgang: boolean;
    TilgangAlert: () => ReactNode;
}

export function useTilgangssjekkBruker(personIdent: string): TilgangssjekkResultat {
    const {data, isError, isPending} = useQuery(sjekkTilgangPerson(personIdent));

    if (isPending) {
        return {harTilgang: false, TilgangAlert: () => null};
    }

    if (isError) {
        console.warn(`Kunne ikke gjøre tilgangskontroll for person. Prøver å vise resultat allikevel`);
        return {harTilgang: true, TilgangAlert: () => null};
    }

    if (data?.harTilgang) {
        return {harTilgang: true, TilgangAlert: () => null};
    }

    return {
        harTilgang: false,
        TilgangAlert: () => <TilgangLocalAlert title={`Du har ikke tilgang til person med id ${personIdent}`}
                                               tilgangResultat={data}/>,
    };
}

export function useTilgangssjekkSak(saksnummer: string): TilgangssjekkResultat {
    const {data, isError, isPending} = useQuery(sjekkTilgangSak(saksnummer));

    if (isPending) {
        return {harTilgang: false, TilgangAlert: () => null};
    }

    if (isError) {
        console.warn(`Kunne ikke gjøre tilgangskontroll for sak. Prøver å vise resultat allikevel`);
        return {harTilgang: true, TilgangAlert: () => null};
    }

    if (data?.harTilgang) {
        return {harTilgang: true, TilgangAlert: () => null};
    }

    return {
        harTilgang: false,
        TilgangAlert: () => <TilgangLocalAlert title={`Du har ikke tilgang til sak ${saksnummer}`}
                                               tilgangResultat={data}/>,
    };
}
