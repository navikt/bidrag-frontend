import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, VStack } from "@navikt/ds-react";
import { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import LasterSkeleton from "../../components/LasterSkeleton";
import FlytSkjema from "../../felles/FlytSkjema";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import {
    type ForelderMedBarnSkjemaData,
    OppfostringsbidragSkjemaSchema,
    type OppfostringsbidragSkjemaSchemaData,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";
import EksisterendeSakSection from "../../sections/EksisterendeSakSection";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import OppsummeringSection from "../../sections/OppsummeringSection";
import { grupperBarnIKurver } from "../../utils";

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
    const { saksrolleFlyt, partISaken: partISakenContext } = useSaksrolleroversikt();
    const form = useFormContext<ForelderMedBarnSkjemaData>();
    useSyncKategori(form);
    const rawBarnkurver = saksrolleFlyt?.type === "OPPFOSTRINGSBIDRAG" ? saksrolleFlyt.barnkurver : [];
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
        error,
        saksnummer,
    } = useFlowSubmission({
        form,
        partISaken: { ...partISaken, erKjent: !!partISaken.ident },
        motpart,
        arbeidsfordeling: "OPS",
        valgteBarn,
    });

    useEffect(() => {
        if (!partISaken.ident && partISakenContext?.ident) {
            form.setValue(
                "partISaken",
                {
                    ...partISakenContext,
                    rolle: "bidragspliktig",
                    erKjent: true,
                },
                { shouldDirty: true, shouldValidate: true },
            );
        }
    }, [form, partISaken.ident, partISakenContext]);

    const erBidragspliktig = true; // I oppfostringsbidrag er partISaken alltid bidragspliktig

    const harBarnMedBarnetSelvSomReellMottaker = valgteBarn.some((b) => b.reellMottakerType === "barnet_selv");

    const harAlleAlternativerValgt =
        valgteBarn.length > 0 &&
        valgteBarn.every(
            (b) =>
                b.reellMottakerType === "annen_person" &&
                typeof b.reellMottaker === "string" &&
                b.reellMottaker.trim().length > 0,
        );

    return (
        <FlytSkjema onSubmit={onSubmit}>
            <VStack gap="space-6">
                <VStack gap="space-12">
                    {eksisterendeSakInfoMelding && (
                        <Alert size="small" variant={eksisterendeSakInfoMelding.type}>
                            {eksisterendeSakInfoMelding.melding}
                        </Alert>
                    )}

                    {harEksisterendeSak && (
                        <EksisterendeSakSection
                            harEksisterendeSak={harEksisterendeSak}
                            eksisterendeSak={eksisterendeSak}
                            partISakenNavn={partISaken.navn || partISaken.ident}
                            motpartNavn="Ukjent"
                        />
                    )}
                </VStack>
                {isLoadingHentSak && <LasterSkeleton tekst="Henter sak..." />}
                <BarnSection
                    form={form}
                    barnkurver={barnkurver}
                    erBidragspliktig={erBidragspliktig}
                    reellMottakerRegel={{ type: "alltid-samhandler" }}
                />
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

                {valgteBarn.length > 0 && (
                    <OppsummeringSection
                        bidragspliktig={
                            partISaken.ident
                                ? {
                                      rolle: "bidragspliktig",
                                      ident: partISaken.ident,
                                      navn: partISaken.navn,
                                      erKjent: true,
                                      diskresjonskode: partISaken.diskresjonskode,
                                  }
                                : null
                        }
                        bidragsmottaker={null}
                        barn={valgteBarn}
                        partISakenRolle="bidragspliktig"
                        hideMissingPartCards
                    />
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
        </FlytSkjema>
    );
}
