import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import type { ReactNode } from "react";
import { PersonRolleKortInnhold } from "./PersonRolleKort";

type BarnKortPerson = {
    ident: string;
    navn?: string | null;
    fødselsdato?: string | null;
    alder?: number;
    erMyndig?: boolean;
    diskresjonskode?: PersonDto["diskresjonskode"];
};

type Props = {
    barn: BarnKortPerson;
    headingActions?: ReactNode;
    children?: ReactNode;
};

function tilPerson(barn: BarnKortPerson): PersonDto {
    return {
        ident: barn.ident,
        visningsnavn: barn.navn ?? "",
        fødselsdato: barn.fødselsdato ?? undefined,
        diskresjonskode: barn.diskresjonskode,
    };
}

function alderForBarn(barn: BarnKortPerson): number | undefined {
    return barn.alder ?? beregnAlderForPerson({ ident: barn.ident, fødselsdato: barn.fødselsdato }) ?? undefined;
}

export function BarnKortInnhold({ barn, ...resten }: Props) {
    return (
        <PersonRolleKortInnhold
            person={tilPerson(barn)}
            rolle="BA"
            alder={alderForBarn(barn)}
            stønad18År={barn.erMyndig}
            {...resten}
        />
    );
}
