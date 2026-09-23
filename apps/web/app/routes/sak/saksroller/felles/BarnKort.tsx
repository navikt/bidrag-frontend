import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import type { ReactNode } from "react";
import PersonRolleKort, { PersonRolleKortInnhold } from "./PersonRolleKort";

export type BarnKortPerson = {
    ident: string;
    navn?: string | null;
    fødselsdato?: string | null;
    alder?: number;
    erMyndig?: boolean;
    diskresjonskode?: PersonDto["diskresjonskode"];
};

type FellesProps = {
    barn: BarnKortPerson | null;
    visIkon?: boolean;
    visKopieringsknapp?: boolean;
    tags?: ReactNode;
    headingActions?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
};

function tilPerson(barn: BarnKortPerson | null): PersonDto | null {
    if (!barn) {
        return null;
    }

    return {
        ident: barn.ident,
        visningsnavn: barn.navn ?? "",
        fødselsdato: barn.fødselsdato ?? undefined,
        diskresjonskode: barn.diskresjonskode,
    };
}

function alderForBarn(barn: BarnKortPerson | null): number | undefined {
    if (!barn) {
        return undefined;
    }

    return barn.alder ?? beregnAlderForPerson({ ident: barn.ident, fødselsdato: barn.fødselsdato }) ?? undefined;
}

export function BarnKortInnhold({ barn, ...resten }: FellesProps) {
    return (
        <PersonRolleKortInnhold
            person={tilPerson(barn)}
            rolle="BA"
            alder={alderForBarn(barn)}
            stønad18År={barn?.erMyndig}
            {...resten}
        />
    );
}

export default function BarnKort({ barn, ...resten }: FellesProps) {
    return (
        <PersonRolleKort
            person={tilPerson(barn)}
            rolle="BA"
            alder={alderForBarn(barn)}
            stønad18År={barn?.erMyndig}
            {...resten}
        />
    );
}

export { alderForBarn };
