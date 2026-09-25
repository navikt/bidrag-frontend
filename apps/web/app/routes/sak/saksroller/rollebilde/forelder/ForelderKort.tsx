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
    visModiaLenke?: boolean;
    visIkon?: boolean;
    visKopieringsknapp?: boolean;
    tags?: ReactNode;
    headingActions?: ReactNode;
    actions?: ReactNode;
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

export function ForelderKortInnhold({ forelder, rolle, visModiaLenke, ...resten }: FellesProps) {
    return (
        <PersonRolleKortInnhold person={tilPerson(forelder)} rolle={rolle} visModiaLenke={visModiaLenke} {...resten} />
    );
}

export default function ForelderKort({ forelder, rolle, visModiaLenke = true, ...resten }: FellesProps) {
    return <PersonRolleKort person={tilPerson(forelder)} rolle={rolle} visModiaLenke={visModiaLenke} {...resten} />;
}
