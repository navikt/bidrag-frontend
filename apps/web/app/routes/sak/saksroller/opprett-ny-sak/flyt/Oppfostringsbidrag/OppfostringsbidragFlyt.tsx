import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";

import RolleFlytSide from "../../felles/RolleFlytSide";
import { useEnPartMedBarnFlyt } from "../../hooks/useEnPartMedBarnFlyt";
import { OppfostringsbidragSkjemaSchema, type OppfostringsbidragSkjemaSchemaData } from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import OppsummeringSection from "../../sections/OppsummeringSection";

export default function OppfostringsbidragFlyt() {
    const context = useSaksrolleroversikt();

    // Call all hooks unconditionally BEFORE any conditional logic
    const form = useForm<OppfostringsbidragSkjemaSchemaData>({
        resolver: zodResolver(OppfostringsbidragSkjemaSchema),
        defaultValues: {
            arbeidsfordeling: "OPS",
            partISaken: {
                ident: "",
                navn: "",
                rolle: "bidragspliktig",
                diskresjonskode: undefined,
                erKjent: false,
            },
            valgteBarn: [],
            motpart: { ident: "", navn: "", rolle: "bidragsmottaker", erKjent: false },
            kategori: context?.sakskategori,
        },
        mode: "onChange",
    });

    // NOW check the condition after all hooks are called
    if (context.saksrolleFlyt?.type !== "OPPFOSTRINGSBIDRAG") {
        return null;
    }

    return (
        <FormProvider {...form}>
            <OppfostringsbidragFlytContent />
        </FormProvider>
    );
}

function OppfostringsbidragFlytContent() {
    const { form, barnkurver, valgteBarn, kjentPart, onSubmit, innsending, status } = useEnPartMedBarnFlyt({
        flytType: "OPPFOSTRINGSBIDRAG",
        arbeidsfordeling: "OPS",
        rolle: "bidragspliktig",
    });

    const harBarnMedBarnetSelvSomReellMottaker = valgteBarn.some((b) => b.reellMottakerType === "barnet_selv");

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={status}
            meldinger={
                <>
                    {valgteBarn.length > 0 && (
                        <Alert variant="info" size="small">
                            Reell mottaker må velges for hvert barn før saken kan opprettes.
                        </Alert>
                    )}
                    {harBarnMedBarnetSelvSomReellMottaker && (
                        <Alert variant="warning" size="small">
                            Barnet selv kan ikke være reell mottaker i oppfostringsbidrag. Velg samhandler som kommune.
                        </Alert>
                    )}
                </>
            }
            submit={<EnhetOgSubmitSection {...innsending} />}
        >
            <BarnSection
                form={form}
                barnkurver={barnkurver}
                reellMottakerRegel={{ type: "alltid-samhandler" }}
                oppdaterMotpart={false}
            />

            <OppsummeringSection
                bidragspliktig={kjentPart}
                bidragsmottaker={null}
                barn={valgteBarn}
                partISakenRolle="bidragspliktig"
                hideMissingPartCards
            />
        </RolleFlytSide>
    );
}
