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
    visRolleTag?: boolean;
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
    const { visRolleTag = true, ...kortProps } = resten;

    return (
        <PersonRolleKortInnhold
            person={tilPerson(barn)}
            rolle={visRolleTag ? "BA" : undefined}
            alder={alderForBarn(barn)}
            stønad18År={barn?.erMyndig}
            {...kortProps}
        />
    );
}

export default function BarnKort({ barn, ...resten }: FellesProps) {
    const { visRolleTag = true, ...kortProps } = resten;

    return (
        <PersonRolleKort
            person={tilPerson(barn)}
            rolle={visRolleTag ? "BA" : undefined}
            alder={alderForBarn(barn)}
            stønad18År={barn?.erMyndig}
            {...kortProps}
        />
    );
}

export { alderForBarn };
