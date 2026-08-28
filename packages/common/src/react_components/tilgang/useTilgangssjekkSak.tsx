import { useQuery } from "@tanstack/react-query";
import { sjekkTilgangSak } from "../../api";
import { tilgangssjekkResultat } from "./tilgangsjekkResultat.tsx";

export function useTilgangssjekkSak(saksnummer?: string) {
    const tilgangsResultat = useQuery(sjekkTilgangSak(saksnummer));
    return tilgangssjekkResultat(tilgangsResultat, `sak: ${saksnummer}`, `Du har ikke tilgang til sak ${saksnummer}`);
}
