import {useQuery} from "@tanstack/react-query";
import {sjekkTilgangPerson, sjekkTilgangSak} from "../../api";
import {List, Loader, LocalAlert} from "@navikt/ds-react";
import {ListItem} from "@navikt/ds-react/List";
import {TilgangAlert} from "./TilgangAlert.tsx";

interface Props {
    personIdent: string;
    children: React.ReactNode;
}

export function TilgangBrukerSjekker({personIdent, children}: Props) {
    const {data, isError, isPending} = useQuery(sjekkTilgangPerson(personIdent))
    console.log("Sjekket tilgang for person",personIdent, data, isError, isPending)
    if (isPending) {
        return <Loader/>
    }

    if (isError) {
        console.warn(`Kunne ikke gjøre tilgangskontroll for person. Prøver å vise resultat allikevel`)
        return children
    }

    if (data?.harTilgang) {
        return children
    }


    return <TilgangAlert title={`Du har ikke tilgang til person med id ${personIdent}`} tilgangResultat={data} />
}

