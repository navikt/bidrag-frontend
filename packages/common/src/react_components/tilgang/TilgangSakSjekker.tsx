import {useQuery} from "@tanstack/react-query";
import {sjekkTilgangSak} from "../../api";
import {List, Loader, LocalAlert} from "@navikt/ds-react";
import {ListItem} from "@navikt/ds-react/List";
import {TilgangAlert} from "./TilgangAlert.tsx";

interface Props {
    saksnummer: string;
    children: React.ReactNode;
}

export function TilgangSakSjekker({saksnummer, children}: Props) {
    const {data, isError, isPending} = useQuery(sjekkTilgangSak(saksnummer))
    if (isPending) {
        return <Loader/>
    }

    if (isError) {
        console.warn(`Kunne ikke gjøre tilgangskontroll for saksnummer: ${saksnummer} Prøver å vise resultat allikevel`)
        return children
    }

    if (data?.harTilgang) {
        return children
    }


    return <TilgangAlert title={`Du har ikke tilgang til sak ${saksnummer}`} tilgangResultat={data} />
}

