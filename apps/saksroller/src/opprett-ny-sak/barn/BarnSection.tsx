import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Tag } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { alderForBarn, tilBarn, validerNyttBarn } from "../../felles/barn/barn-regler";
import { LeggTilBarnSøk, useBarnSøk } from "../../felles/person-søk/BarnSøk";
import type { ReellMottakerRegel } from "../../felles/saksregler";
import { type Barnkurv, type BarnMedAlder, BarnMedAlderSchema } from "../skjema/opprett-sak-schema";
import SkjemaSeksjon from "../skjema/SkjemaSeksjon";
import BarnkurvListe from "./BarnkurvListe";

interface BarnSectionProps<T extends { valgteBarn: BarnMedAlder[] }> {
    form: UseFormReturn<T>;
    barnkurver?: Barnkurv[];
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
    beskrivelse?: string;
    maksEttBarn?: boolean;
}

type BarnForm = UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;

export default function BarnSection<T extends { valgteBarn: BarnMedAlder[] }>({
    form,
    barnkurver = [],
    reellMottakerRegel,
    onKurvByttet,
    beskrivelse,
    maksEttBarn = false,
}: BarnSectionProps<T>) {
    const barnForm = form as unknown as BarnForm;
    const valgteBarn = barnForm.watch("valgteBarn");

    const [visSøk, setVisSøk] = useState(false);
    const søk = useBarnSøk({
        valider: (person) => {
            const feil = validerNyttBarn(person, {
                identerISaken: barnForm.getValues("valgteBarn").map((barn) => barn.ident),
                identerIForslag: barnkurver.flatMap((kurv) => kurv.barn.map((barn) => barn.ident)),
            });
            if (feil) throw new Error(feil);
            return alderForBarn(person);
        },
        onLeggTil: ({ person }) => {
            leggTilBarnManuelt(person);
            søk.lukk();
        },
        onLukk: () => setVisSøk(false),
    });

    const leggTilBarnManuelt = (person: PersonDto) => {
        const barnValidation = BarnMedAlderSchema.safeParse({ ...tilBarn(person), manuellLagtTil: true });

        if (!barnValidation.success) {
            throw new Error("Kunne ikke validere barn som ble lagt til manuelt");
        }

        const valgteBarn = maksEttBarn
            ? [barnValidation.data]
            : [...barnForm.getValues("valgteBarn"), barnValidation.data];
        barnForm.setValue("valgteBarn", valgteBarn, {
            shouldValidate: form.formState.isSubmitted,
            shouldDirty: true,
            shouldTouch: true,
        });
    };

    return (
        <SkjemaSeksjon
            tittel="Velg barn saken gjelder for"
            beskrivelse={beskrivelse}
            handling={
                <Tag size="small" variant="info">
                    {valgteBarn.length} valgt
                </Tag>
            }
        >
            <BarnkurvListe
                barnkurver={barnkurver}
                form={barnForm}
                reellMottakerRegel={reellMottakerRegel}
                onKurvByttet={onKurvByttet}
                maksEttBarn={maksEttBarn}
            />

            <LeggTilBarnSøk søk={søk} visSøk={visSøk} onÅpne={() => setVisSøk(true)} />

            {valgteBarn.length === 0 && form.formState.errors.valgteBarn && (
                <Alert variant="error" size="small">
                    {String(form.formState.errors.valgteBarn.message ?? "")}
                </Alert>
            )}
        </SkjemaSeksjon>
    );
}
