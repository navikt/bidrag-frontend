import type { PersonDto } from "@bidrag/api/PersonApi";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
    BarnSøkHandlinger,
    BarnSøkIkon,
    BarnSøkInnhold,
    barnSøkTittel,
    LeggTilBarnKnapp,
    useBarnSøk,
} from "../../felles/person-søk/BarnSøk";
import PersonSøkWrapper from "../../felles/person-søk/PersonSøkWrapper";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";
import { validerBarn } from "./barn-validering";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;
    leggTilBarnManuell: (barn: PersonDto, alder: number) => void | Promise<void>;
};

export default function BarnManueltRegistrering({ form, leggTilBarnManuell, barnkurver }: Props) {
    const [visSøk, setVisSøk] = useState(false);
    const søk = useBarnSøk({
        valider: (barn) => validerBarn(barn, form.getValues("valgteBarn"), barnkurver),
        onLeggTil: async ({ person, alder }) => {
            await leggTilBarnManuell(person, alder);
            søk.lukk();
        },
        onLukk: () => setVisSøk(false),
    });

    if (!visSøk) {
        return <LeggTilBarnKnapp onClick={() => setVisSøk(true)} />;
    }

    return (
        <PersonSøkWrapper
            tittel={barnSøkTittel}
            ikon={<BarnSøkIkon />}
            onAvbryt={søk.lukk}
            actions={<BarnSøkHandlinger søk={søk} />}
        >
            <BarnSøkInnhold søk={søk} />
        </PersonSøkWrapper>
    );
}
