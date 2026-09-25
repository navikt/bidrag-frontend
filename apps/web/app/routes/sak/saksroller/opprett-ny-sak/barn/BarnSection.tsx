import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Tag } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import type { ReellMottakerRegel } from "../../felles/reell-mottaker/reell-mottaker-regel";
import { type Barnkurv, type BarnMedAlder, BarnMedAlderSchema, MYNDYG_BARN_ALDER } from "../skjema/opprett-sak-schema";
import SkjemaSeksjon from "../skjema/SkjemaSeksjon";
import BarnkurvListe from "./BarnkurvListe";
import BarnManueltRegistrering from "./BarnManueltRegistrering";

interface BarnSectionProps<T extends { valgteBarn: BarnMedAlder[] }> {
    form: UseFormReturn<T>;
    barnkurver?: Barnkurv[];
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
    beskrivelse?: string;
}

type BarnForm = UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;

export default function BarnSection<T extends { valgteBarn: BarnMedAlder[] }>({
    form,
    barnkurver = [],
    reellMottakerRegel,
    onKurvByttet,
    beskrivelse,
}: BarnSectionProps<T>) {
    const barnForm = form as unknown as BarnForm;
    const valgteBarn = barnForm.watch("valgteBarn");

    const leggTilBarnManuell = async (person: PersonDto, alder: number) => {
        const nyttBarn: BarnMedAlder = {
            ident: person.ident,
            navn: person.visningsnavn,
            erMyndig: alder >= MYNDYG_BARN_ALDER,
            alder: alder,
            reellMottakerType: "ingen",
            reellMottaker: "",
            reellMottakerNavn: "",
            manuellLagtTil: true,
            fødselsdato: person?.fødselsdato || "",
            diskresjonskode: person.diskresjonskode,
        };

        const barnValidation = BarnMedAlderSchema.safeParse(nyttBarn);

        if (!barnValidation.success) {
            throw new Error("Kunne ikke validere barn som ble lagt til manuelt");
        }

        const oppdaterteBarn = [...barnForm.getValues("valgteBarn"), barnValidation.data];

        barnForm.setValue("valgteBarn", oppdaterteBarn, {
            shouldValidate: barnValidation.data.erMyndig,
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
            />

            <BarnManueltRegistrering form={barnForm} leggTilBarnManuell={leggTilBarnManuell} barnkurver={barnkurver} />

            {valgteBarn.length === 0 && form.formState.errors.valgteBarn && (
                <Alert variant="error" size="small">
                    {String(form.formState.errors.valgteBarn.message ?? "")}
                </Alert>
            )}
        </SkjemaSeksjon>
    );
}
