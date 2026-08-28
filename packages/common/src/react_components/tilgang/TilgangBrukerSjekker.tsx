import {useTilgangssjekkBruker} from "./useTilgangSjekkBruker.tsx";

interface Props {
    personIdent: string;
    children: React.ReactNode;
}

export function TilgangBrukerSjekker({personIdent, children}: Props) {
    const {harTilgang, TilgangAlert} = useTilgangssjekkBruker(personIdent)

    if (!harTilgang) {
        return <TilgangAlert/>
    }

    return children
}

