import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import RolleFlytSide from "../../felles/RolleFlytSide";
import { useEnPartMedBarnFlyt } from "../../hooks/useEnPartMedBarnFlyt";
import { FarskapsSkjemaSchema, type FarskapsSkjemaSchemaData } from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import OppsummeringSection from "../../sections/OppsummeringSection";

export default function FarskapsFlyt() {
    const { saksrolleFlyt, sakskategori } = useSaksrolleroversikt();

    // Call all hooks unconditionally BEFORE any conditional logic
    const form = useForm<FarskapsSkjemaSchemaData>({
        resolver: zodResolver(FarskapsSkjemaSchema),
        defaultValues: {
            arbeidsfordeling: "FRS",
            partISaken: {
                ident: "",
                navn: "",
                rolle: "bidragsmottaker",
                diskresjonskode: undefined,
                erKjent: false,
            },
            valgteBarn: [],
            motpart: { ident: "", navn: "", rolle: "bidragspliktig", erKjent: false },
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    // NOW check the condition after all hooks are called
    if (saksrolleFlyt?.type !== "FARSKAP") {
        return null;
    }

    return (
        <FormProvider {...form}>
            <FarskapsFlytContent />
        </FormProvider>
    );
}

function FarskapsFlytContent() {
    const { form, barnkurver, valgteBarn, kjentPart, onSubmit, innsending, status } = useEnPartMedBarnFlyt({
        flytType: "FARSKAP",
        arbeidsfordeling: "FRS",
        rolle: "bidragsmottaker",
    });

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{ ...status, lastetekst: "Henter barn..." }}
            submit={<EnhetOgSubmitSection {...innsending} />}
        >
            <BarnSection
                form={form}
                barnkurver={barnkurver}
                reellMottakerRegel={{ type: "skjult" }}
                oppdaterMotpart={false}
                beskrivelse="Velg barnet saken gjelder. Den andre forelderen registreres når farskapet er avklart."
            />

            <OppsummeringSection
                bidragspliktig={null}
                bidragsmottaker={kjentPart}
                barn={valgteBarn}
                partISakenRolle="bidragsmottaker"
                hideMissingPartCards
            />
        </RolleFlytSide>
    );
}
