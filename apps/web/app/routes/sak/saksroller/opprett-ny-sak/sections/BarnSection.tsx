import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Tag } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import BarnManueltRegistrering from "../BarnManueltRegistrering";
import SkjemaSeksjon from "../felles/SkjemaSeksjon";
import BarnkurvListe from "../motpart-felles/BarnkurvListe";
import ValgteBarnListe from "../motpart-felles/ValgteBarnListe";
import {
    type Barnkurv,
    type BarnMedAlder,
    BarnMedAlderSchema,
    type ForelderMedBarnSkjemaData,
    MYNDYG_BARN_ALDER,
} from "../opprett-sak-schema";
import type { ReellMottakerRegel } from "../reell-mottaker-regel";

interface BarnSectionProps<T extends { valgteBarn: BarnMedAlder[] }> {
    form: UseFormReturn<T>;
    barnkurver?: Barnkurv[];
    reellMottakerRegel: ReellMottakerRegel;
    onResetMotpart?: () => void;
    oppdaterMotpart?: boolean;
    beskrivelse?: string;
}

export default function BarnSection<T extends { valgteBarn: BarnMedAlder[] }>({
    form,
    barnkurver = [],
    reellMottakerRegel,
    onResetMotpart,
    oppdaterMotpart,
    beskrivelse = "Velg alle barn som skal være med i saken",
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
    const manuellLagtTilBarn = valgteBarn.filter((b) => b.manuellLagtTil);

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

    const fjernBarn = (barnIdent: string) => {
        const oppdaterteBarn = valgteBarn.filter((b) => b.ident !== barnIdent);
        forelderBarnForm.setValue("valgteBarn", oppdaterteBarn);

        if (oppdaterteBarn.length === 0 && onResetMotpart) {
            onResetMotpart();
        }
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
            {barnkurver.length > 0 && (
                <BarnkurvListe
                    barnkurver={barnkurver}
                    form={forelderBarnForm as unknown as UseFormReturn<ForelderMedBarnSkjemaData>}
                    reellMottakerRegel={reellMottakerRegel}
                    oppdaterMotpart={oppdaterMotpart}
                />
            )}

            <BarnManueltRegistrering
                form={forelderBarnForm as unknown as UseFormReturn<ForelderMedBarnSkjemaData>}
                leggTilBarnManuell={leggTilBarnManuell}
                barnkurver={barnkurver}
            />

            {manuellLagtTilBarn.length > 0 && (
                <ValgteBarnListe
                    form={valgteBarnForm}
                    valgteBarn={manuellLagtTilBarn}
                    alleBarn={valgteBarn}
                    fjernBarn={fjernBarn}
                    tittel="Barn som legges til manuelt"
                    heading={{ size: "small", level: "3" }}
                    reellMottakerRegel={reellMottakerRegel}
                />
            )}

            {valgteBarn.length === 0 && form.formState.errors.valgteBarn && (
                <Alert variant="error" size="small">
                    {String(form.formState.errors.valgteBarn.message ?? "")}
                </Alert>
            )}
        </SkjemaSeksjon>
    );
}
