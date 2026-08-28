import type { ReactNode } from "react";
import { useTilgangssjekkBruker } from "./useTilgangSjekkBruker";

interface Props {
    personIdent: string;
    children: ReactNode;
}

export function TilgangBrukerSjekker({ personIdent, children }: Props) {
    const { harTilgang, TilgangAlert } = useTilgangssjekkBruker(personIdent);

    if (!harTilgang) {
        return <TilgangAlert />;
    }

    return children;
}
