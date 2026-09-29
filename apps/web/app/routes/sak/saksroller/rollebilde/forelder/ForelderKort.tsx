import type { PersonDto } from "@bidrag/api/PersonApi";
import type { ReactNode } from "react";
import PersonRolleKort, { PersonRolleKortInnhold } from "../../felles/person/PersonRolleKort";

type ForelderKortPerson = {
    ident: string;
    navn?: string | null;
    fødselsdato?: string | null;
    diskresjonskode?: PersonDto["diskresjonskode"];
};

type FellesProps = {
    forelder: ForelderKortPerson | null;
    ukjentTekst?: string;
    rolle?: "BP" | "BM";
    tags?: ReactNode;
    actions?: ReactNode;
    søktIdent?: string;
    children?: ReactNode;
};

function tilPerson(forelder: ForelderKortPerson | null): PersonDto | null {
    if (!forelder) {
        return null;
    }

    return {
        ident: forelder.ident,
        visningsnavn: forelder.navn ?? "",
        fødselsdato: forelder.fødselsdato ?? undefined,
        diskresjonskode: forelder.diskresjonskode,
    };
}

export function ForelderKortInnhold({ forelder, ...resten }: FellesProps) {
    return <PersonRolleKortInnhold person={tilPerson(forelder)} {...resten} />;
}

export default function ForelderKort({ forelder, ...resten }: FellesProps) {
    return <PersonRolleKort person={tilPerson(forelder)} {...resten} />;
}
