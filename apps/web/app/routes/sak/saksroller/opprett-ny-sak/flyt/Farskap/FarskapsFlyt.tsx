import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import RolleFlytSide from "../../felles/RolleFlytSide";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import { FarskapsSkjemaSchema, type FarskapsSkjemaSchemaData } from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import OppsummeringSection from "../../sections/OppsummeringSection";
import { grupperBarnIKurver } from "../../utils";

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
    const { saksrolleFlyt, partISaken: partISakenContext } = useSaksrolleroversikt();
    const form = useFormContext<FarskapsSkjemaSchemaData>();
    useSyncKategori(form);
    const rawBarnkurver = saksrolleFlyt?.type === "FARSKAP" ? saksrolleFlyt.barnkurver : [];
    const barnkurver = grupperBarnIKurver(rawBarnkurver);

    const valgteBarn = form.watch("valgteBarn");
    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");

    const {
        enhet,
        enhetNavn,
        isLoadingEnhet,
        enhetError,
        harEksisterendeSak,
        eksisterendeSak,
        isLoadingHentSak,
        infoMelding: eksisterendeSakInfoMelding,
        onSubmit,
        isLoadingOpprettSak,
        error,
        saksnummer,
    } = useFlowSubmission({
        form,
        partISaken: { ...partISaken, erKjent: !!partISaken.ident },
        motpart,
        arbeidsfordeling: "FRS",
        valgteBarn,
    });

    useEffect(() => {
        if (!partISaken.ident && partISakenContext?.ident) {
            form.setValue(
                "partISaken",
                {
                    ...partISakenContext,
                    rolle: "bidragsmottaker",
                    erKjent: true,
                },
                { shouldDirty: true, shouldValidate: true },
            );
        }
    }, [form, partISaken.ident, partISakenContext]);

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{
                infoMelding: eksisterendeSakInfoMelding,
                harEksisterendeSak,
                eksisterendeSak,
                isLoading: isLoadingHentSak,
                partISakenNavn: partISaken.navn || partISaken.ident,
                motpartNavn: "Ukjent",
                lastetekst: "Henter barn...",
            }}
            submit={
                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    blocked={harEksisterendeSak || isLoadingHentSak || isLoadingEnhet}
                    submitError={error}
                    isLoading={isLoadingOpprettSak}
                    saksnummer={saksnummer}
                />
            }
        >
            <BarnSection form={form} barnkurver={barnkurver} reellMottakerRegel={{ type: "skjult" }} oppdaterMotpart={false} />

            <OppsummeringSection
                bidragspliktig={null}
                bidragsmottaker={
                    partISaken.ident
                        ? {
                              rolle: "bidragsmottaker",
                              ident: partISaken.ident,
                              navn: partISaken.navn,
                              erKjent: true,
                              diskresjonskode: partISaken.diskresjonskode,
                          }
                        : null
                }
                barn={valgteBarn}
                partISakenRolle="bidragsmottaker"
                hideMissingPartCards
            />
        </RolleFlytSide>
    );
}
