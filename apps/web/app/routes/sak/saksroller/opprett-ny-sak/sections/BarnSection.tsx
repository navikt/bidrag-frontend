import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Tag } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import type { ReellMottakerRegel } from "../../reell-mottaker-regel";
import BarnManueltRegistrering from "../BarnManueltRegistrering";
import SkjemaSeksjon from "../felles/SkjemaSeksjon";
import BarnkurvListe from "../motpart-felles/BarnkurvListe";
import { type Barnkurv, type BarnMedAlder, BarnMedAlderSchema, MYNDYG_BARN_ALDER } from "../opprett-sak-schema";

interface BarnSectionProps<T extends { valgteBarn: BarnMedAlder[] }> {
    form: UseFormReturn<T>;
    barnkurver?: Barnkurv[];
    reellMottakerRegel: ReellMottakerRegel;
    onKurvByttet?: (kurv: Barnkurv | null) => void;
    låsteIdenter?: string[];
    beskrivelse?: string;
}

export default function BarnSection<T extends { valgteBarn: BarnMedAlder[] }>({
    form,
    barnkurver = [],
    reellMottakerRegel,
    onKurvByttet,
    låsteIdenter,
    beskrivelse,
}: BarnSectionProps<T>) {
    const forelderBarnForm = form as unknown as UseFormReturn<{
        valgteBarn: BarnMedAlder[];
        motpart?: {
            ident?: string;
            navn?: string;
            erKjent?: boolean;
            rolle?: string;
            diskresjonskode?: string;
        };
    }>;
    const valgteBarnForm = form as unknown as UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;
    const valgteBarn = forelderBarnForm.watch("valgteBarn") as BarnMedAlder[];

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

        const oppdaterteBarn = [...(forelderBarnForm.getValues("valgteBarn") as BarnMedAlder[]), barnValidation.data];

        forelderBarnForm.setValue("valgteBarn", oppdaterteBarn, {
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
                form={valgteBarnForm}
                reellMottakerRegel={reellMottakerRegel}
                onKurvByttet={onKurvByttet}
                låsteIdenter={låsteIdenter}
            />

            <BarnManueltRegistrering
                form={valgteBarnForm}
                leggTilBarnManuell={leggTilBarnManuell}
                barnkurver={barnkurver}
            />

            {valgteBarn.length === 0 && form.formState.errors.valgteBarn && (
                <Alert variant="error" size="small">
                    {String(form.formState.errors.valgteBarn.message ?? "")}
                </Alert>
            )}
        </SkjemaSeksjon>
    );
}
