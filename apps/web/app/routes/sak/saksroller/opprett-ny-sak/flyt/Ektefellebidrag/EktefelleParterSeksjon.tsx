import type { PersonDto } from "@bidrag/api/PersonApi";
import type { UseFormReturn } from "react-hook-form";

import ParterSeksjon from "../../felles/ParterSeksjon";
import type { EktefellebidragSkjemaData, ForelderPartRolle } from "../../opprett-sak-schema";
import EktefelleMotpartVelger from "./EktefelleMotpartVelger";

type Props = {
    form: UseFormReturn<EktefellebidragSkjemaData>;
    forslagMotpart: PersonDto[];
    motsattRolle: ForelderPartRolle;
};

export default function EktefelleParterSeksjon({ form, forslagMotpart, motsattRolle }: Props) {
    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");

    return (
        <ParterSeksjon
            partISaken={{ ...partISaken, erKjent: true }}
            partISakenRolle={partISaken.rolle as ForelderPartRolle}
            motpart={motpart}
            motpartRolle={motsattRolle}
            motpartInnhold={
                <EktefelleMotpartVelger form={form} forslagMotpart={forslagMotpart} motsattRolle={motsattRolle} />
            }
            beskrivelse="Velg ektefelle eller partner og kontroller rollene i saken."
            feil={form.formState.errors.motpart?.ident?.message}
        />
    );
}
