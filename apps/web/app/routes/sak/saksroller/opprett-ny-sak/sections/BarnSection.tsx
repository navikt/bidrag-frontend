import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, BodyShort, Heading, Tag, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import BarnManueltRegistrering from "../BarnManueltRegistrering";
import BarnkurvListe from "../motpart-felles/BarnkurvListe";
import ValgteBarnListe from "../motpart-felles/ValgteBarnListe";
import {
    type Barnkurv,
    type BarnMedAlder,
    BarnMedAlderSchema,
    type ForelderMedBarnSkjemaData,
    MYNDYG_BARN_ALDER,
} from "../opprett-sak-schema";

interface BarnSectionProps<T extends { valgteBarn: BarnMedAlder[] }> {
    form: UseFormReturn<T>;
    barnkurver?: Barnkurv[];
    aktivKurvId?: string | null;
    erBidragspliktig?: boolean;
    visReellMottaker?: boolean;
    bidragsmottakerErUkjent?: boolean;
    reellMottakerAlltidPåkrevd?: boolean;
    kunSamhandlerSomReellMottaker?: boolean;
    onResetMotpart?: () => void;
}

export default function BarnSection<T extends { valgteBarn: BarnMedAlder[] }>({
    form,
    barnkurver = [],
    aktivKurvId = null,
    erBidragspliktig = false,
    visReellMottaker = true,
    bidragsmottakerErUkjent = false,
    reellMottakerAlltidPåkrevd = false,
    kunSamhandlerSomReellMottaker = false,
    onResetMotpart,
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
            console.error("Validering feilet:", barnValidation.error);
            return;
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
        <VStack gap="space-6">
            <div className="flex items-center justify-between">
                <div>
                    <Heading level="2" size="medium">
                        Velg barn saken gjelder for
                    </Heading>
                    <BodyShort size="small" className="text-ax-neutral-700 mt-1">
                        Velg alle barn som skal være med i saken
                    </BodyShort>
                </div>
                <Tag size="small" variant="info">
                    {valgteBarn.length} valgt
                </Tag>
            </div>

            {barnkurver.length > 0 && (
                <BarnkurvListe
                    barnkurver={barnkurver}
                    aktivKurvId={aktivKurvId}
                    form={forelderBarnForm as unknown as UseFormReturn<ForelderMedBarnSkjemaData>}
                    visReellMottaker={visReellMottaker}
                    bidragsmottakerErUkjent={bidragsmottakerErUkjent}
                    reellMottakerAlltidPåkrevd={reellMottakerAlltidPåkrevd}
                    kunSamhandlerSomReellMottaker={kunSamhandlerSomReellMottaker}
                />
            )}

            <div className="border-t border-ax-neutral-300" />

            <BarnManueltRegistrering
                form={forelderBarnForm as unknown as UseFormReturn<ForelderMedBarnSkjemaData>}
                leggTilBarnMauell={leggTilBarnManuell}
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
                    visReellMottaker={visReellMottaker}
                    bidragsmottakerErUkjent={bidragsmottakerErUkjent}
                    reellMottakerAlltidPåkrevd={reellMottakerAlltidPåkrevd}
                    kunSamhandlerSomReellMottaker={kunSamhandlerSomReellMottaker}
                />
            )}

            {erBidragspliktig && valgteBarn.length === 0 && form.formState.errors.valgteBarn && (
                <Alert variant="error" size="small">
                    {String(form.formState.errors.valgteBarn.message ?? "")}
                </Alert>
            )}
        </VStack>
    );
}
