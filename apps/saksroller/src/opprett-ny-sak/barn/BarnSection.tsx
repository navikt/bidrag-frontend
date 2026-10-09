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
import { useBarnkurverMedSøsken } from "./useBarnkurverMedSøsken";
import { useFjernBarnUtenforKurver } from "./useFjernBarnUtenforKurver";

interface BarnSectionProps<T extends { valgteBarn: BarnMedAlder[] }> {
    form: UseFormReturn<T>;
    barnkurver?: Barnkurv[];
    /** Tittel for barn som ikke finnes i noen barnkurv. Standard er «Med ukjent forelder». */
    manuellTittel?: string;
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
    beskrivelse?: string;
    maksEttBarn?: boolean;
    /** Barnkurvene eller foreldrene som avgjør dem, hentes. Viser lasting så barn ikke hopper mellom grupper. */
    lasterKurver?: boolean;
}

type BarnForm = UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;

export default function BarnSection<T extends { valgteBarn: BarnMedAlder[] }>({
    form,
    barnkurver = [],
    manuellTittel,
    reellMottakerRegel,
    onKurvByttet,
    beskrivelse,
    maksEttBarn = false,
    lasterKurver = false,
}: BarnSectionProps<T>) {
    const barnForm = form as unknown as BarnForm;
    const valgteBarn = barnForm.watch("valgteBarn");
    const søsken = useBarnkurverMedSøsken(barnkurver, valgteBarn);
    const synligeBarnkurver = søsken.barnkurver;
    useFjernBarnUtenforKurver(barnForm, synligeBarnkurver, lasterKurver || søsken.laster);

    const [visSøk, setVisSøk] = useState(false);
    const søk = useBarnSøk({
        valider: (person) => {
            const feil = validerNyttBarn(person, {
                identerISaken: barnForm.getValues("valgteBarn").map((barn) => barn.ident),
                identerIForslag: synligeBarnkurver.flatMap((kurv) => kurv.barn.map((barn) => barn.ident)),
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
            {søsken.feil && (
                <Alert variant="warning" size="small">
                    Kunne ikke hente foreldre og søsken for barnet. Du kan søke opp barn manuelt.
                </Alert>
            )}
            <BarnkurvListe
                barnkurver={synligeBarnkurver}
                laster={lasterKurver || søsken.laster}
                manuellTittel={manuellTittel}
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
