import {sjekkTilgangPerson} from "../../api";
import {tilgangssjekkResultat} from "./tilgangsjekkResultat.tsx";
import {useQuery} from "@tanstack/react-query";


export function useTilgangssjekkBruker(personIdent: string) {
    const tilgangsResultat = useQuery(sjekkTilgangPerson(personIdent));
    return tilgangssjekkResultat(
        tilgangsResultat,
        `person: ${personIdent}`,
        `Du har ikke tilgang til person med id ${personIdent}`,
    );
}

