import {useTilgangssjekkSak} from "./useTilgangSjekk.tsx";

interface Props {
    saksnummer: string;
    children: React.ReactNode;
}

export function TilgangSakSjekker({saksnummer, children}: Props) {
    const {harTilgang, TilgangAlert} = useTilgangssjekkSak(saksnummer)

    if (!harTilgang) {
        return <TilgangAlert/>
    }

    return children
}

