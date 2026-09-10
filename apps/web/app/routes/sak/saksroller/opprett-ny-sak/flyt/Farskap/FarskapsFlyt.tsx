import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, VStack } from "@navikt/ds-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import LasterSkeleton from "../../components/LasterSkeleton";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import { FarskapsSkjemaSchema, type FarskapsSkjemaSchemaData } from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";
import EksisterendeSakSection from "../../sections/EksisterendeSakSection";
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
    const [aktivKurvId, settAktivKurvId] = useState<string | null>(null);
    const errorAlertRef = useRef<HTMLDivElement>(null);
    const rawBarnkurver = saksrolleFlyt?.type === "FARSKAP" ? saksrolleFlyt.barnkurver : [];
    const barnkurver = grupperBarnIKurver(rawBarnkurver);

    const valgteBarn = form.watch("valgteBarn");
    const partISaken = form.watch("partISaken");

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
        error,
        saksnummer,
    } = useFlowSubmission({
        form,
        partISaken: { ...partISaken, erKjent: !!partISaken.ident },
        motpart: null,
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

    const erBidragsmottaker = true; // I FARSKAP er partISaken alltid bidragsmottaker

    useEffect(() => {
        if (error && errorAlertRef.current) {
            errorAlertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            errorAlertRef.current.focus();
        }
    }, [error]);

    useEffect(() => {
        const barnFraRelasjon = valgteBarn.filter((b) => !b.manuellLagtTil);
        const [enesteBarnFraRelasjon] = barnFraRelasjon;
        if (barnFraRelasjon.length === 0) {
            settAktivKurvId(null);
        } else if (barnFraRelasjon.length === 1 && enesteBarnFraRelasjon) {
            const kurv = barnkurver.find((barn) => barn.barn.some((b) => b.ident === enesteBarnFraRelasjon.ident));
            if (kurv) {
                settAktivKurvId(kurv.id);
            }
        }
    }, [valgteBarn.length]);

    const harAlleAlternativerValgt = valgteBarn.length > 0; // For FARSKAP, reellMottaker is NOT required

    return (
        <Box asChild borderRadius="2" background="default">
            <VStack as="form" onSubmit={onSubmit} gap="space-16" padding="space-12">
                <VStack gap="space-12">
                    {eksisterendeSakInfoMelding && (
                        <Alert size="small" variant={eksisterendeSakInfoMelding.type}>
                            {eksisterendeSakInfoMelding.melding}
                        </Alert>
                    )}

                    <EksisterendeSakSection
                        harEksisterendeSak={harEksisterendeSak}
                        eksisterendeSak={eksisterendeSak}
                        partISakenNavn={partISaken.navn || partISaken.ident}
                        motpartNavn="Ukjent"
                    />
                </VStack>

                {isLoadingHentSak && <LasterSkeleton tekst="Henter barn..." />}

                <BarnSection
                    form={form}
                    barnkurver={barnkurver}
                    aktivKurvId={aktivKurvId}
                    erBidragspliktig={!erBidragsmottaker}
                    visReellMottaker={false}
                />

                {valgteBarn.length > 0 && (
                    <>
                        <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
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
                    </>
                )}

                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    disabled={!harAlleAlternativerValgt || harEksisterendeSak || isLoadingHentSak || isLoadingEnhet}
                    submitError={error}
                    saksnummer={saksnummer}
                />
            </VStack>
        </Box>
    );
}
