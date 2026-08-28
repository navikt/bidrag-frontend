import {tilgangssjekkResultat} from "./tilgangsjekkResultat.tsx";
import {sjekkTilgangSak} from "../../api";
import {useQuery} from "@tanstack/react-query";

export function useTilgangssjekkSak(saksnummer?: string) {
    const tilgangsResultat = useQuery(sjekkTilgangSak(saksnummer));
    return tilgangssjekkResultat(
        tilgangsResultat,
        `sak: ${saksnummer}`,
        `Du har ikke tilgang til sak ${saksnummer}`,
    );
}
