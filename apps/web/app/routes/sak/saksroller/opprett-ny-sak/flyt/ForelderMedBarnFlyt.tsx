import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, VStack } from "@navikt/ds-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useSjekkTilgangOpprettSakUtenBm } from "~/api/useApi.ts";

import LasterSkeleton from "../components/LasterSkeleton";
import { useFlowSubmission } from "../hooks/useFlowSubmission";
import { useMotpartHandling } from "../hooks/useMotpartHandling";
import useSyncKategori from "../hooks/useSyncKategori";
import {
    type ForelderMedBarnSkjemaData,
    ForelderMedBarnSkjemaSchema,
    type ForelderPartRolle,
} from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";
import BarnSection from "../sections/BarnSection";
import EksisterendeSakSection from "../sections/EksisterendeSakSection";
import EnhetOgSubmitSection from "../sections/EnhetOgSubmitSection";
import MotpartSection from "../sections/MotpartSection";
import ValideringsAlertsSection from "../sections/ValideringsAlertsSection";
import { grupperBarnIKurver, hentMotsattRolle } from "../utils";

export default function ForelderMedBarnFlyt() {
    const { partISaken, saksrolleFlyt, sakskategori } = useSaksrolleroversikt();

    if (!partISaken || !saksrolleFlyt || saksrolleFlyt.type !== "FORELDER_MED_BARN") {
        return null;
    }

    const motsattRolle = hentMotsattRolle(partISaken.rolle as ForelderPartRolle);

    const form = useForm<ForelderMedBarnSkjemaData>({
        resolver: zodResolver(ForelderMedBarnSkjemaSchema),
        defaultValues: {
            partISaken: partISaken,
            valgteBarn: [],
            motpart: {
                erKjent: false,
                rolle: motsattRolle,
            },
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    return (
        <FormProvider {...form}>
            <ForelderMedBarnFlytContent />
        </FormProvider>
    );
}

function ForelderMedBarnFlytContent() {
    const { partISaken, saksrolleFlyt, setIsLoadingOpprettSak } = useSaksrolleroversikt();
    const form = useFormContext<ForelderMedBarnSkjemaData>();
    useSyncKategori(form);
    const [aktivKurvId, settAktivKurvId] = useState<string | null>(null);
    const bidragsmottakerRegistreringRef = useRef<HTMLDialogElement>(null);
    const errorAlertRef = useRef<HTMLDivElement>(null);
    const rawBarnkurver = saksrolleFlyt?.type === "FORELDER_MED_BARN" ? saksrolleFlyt.barnkurver : [];
    const barnkurver = grupperBarnIKurver(rawBarnkurver);

    useEffect(() => {
        if (partISaken) {
            form.setValue("partISaken.rolle", partISaken.rolle);
        }
    }, [partISaken]);

    const valgteBarn = form.watch("valgteBarn");
    const motpart = form.watch("motpart");

    const { settMotpartUkjent, leggTilMotpartManuell } = useMotpartHandling(form, () => {
        settAktivKurvId(null);
    });

    const erBidragspliktig = partISaken?.rolle === "bidragspliktig";
    const erBidragsmottaker = partISaken?.rolle === "bidragsmottaker";

    const bidragsmottaker = erBidragsmottaker ? partISaken : motpart;
    const bidragspliktig = erBidragspliktig ? partISaken : motpart;

    const resetMotpart = () => {
        form.setValue("motpart", {
            ident: "",
            navn: "",
            erKjent: false,
            rolle: form.getValues("motpart.rolle"),
            diskresjonskode: undefined,
        });
    };
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
        partISaken: { ...form.watch("partISaken"), erKjent: true },
        motpart: { ident: motpart.ident, erKjent: motpart.erKjent, rolle: motpart.rolle, navn: motpart.navn },
        valgteBarn,
        eksisterendeSakPartISaken: { ...form.watch("partISaken"), erKjent: true },
        eksisterendeSakMotpart: {
            ident: motpart.ident ?? "",
            erKjent: motpart.erKjent,
            rolle: motpart.rolle ?? "",
            navn: motpart.navn ?? "",
        },
        bidragspliktig,
        bidragsmottaker,
    });

    useEffect(() => {
        setIsLoadingOpprettSak(isLoadingOpprettSak);
    }, [isLoadingOpprettSak]);

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

    const bidragsmottakerErUkjent = typeof bidragsmottaker?.erKjent === "boolean" && !bidragsmottaker.erKjent;
    const { data: kanOppretteSakUtenBm, isLoading: sjekkerTilgangUtenBm } =
        useSjekkTilgangOpprettSakUtenBm(bidragsmottakerErUkjent);
    const harValgteBarnRelasjonTilMotpart =
        rawBarnkurver.find((kurv) => {
            const identer = kurv.fellesBarn.map((barn) => barn.ident);
            return valgteBarn.some((lagtTilBarn) => identer.includes(lagtTilBarn.ident));
        })?.motpart?.ident === motpart?.ident;

    const visValideringsAlerts =
        (valgteBarn.length > 0 && (bidragsmottakerErUkjent || !harValgteBarnRelasjonTilMotpart)) ||
        (erBidragsmottaker && valgteBarn.length === 0);

    return (
        <Box
            as="form"
            onSubmit={onSubmit}
            borderRadius={"2"}
            background="default"
            padding={"space-12"}
            className="gap-4 flex flex-col"
        >
            <VStack gap="space-6">
                <div className="space-y-3">
                    {eksisterendeSakInfoMelding && (
                        <Alert size="small" variant={eksisterendeSakInfoMelding.type}>
                            {eksisterendeSakInfoMelding.melding}
                        </Alert>
                    )}

                    <EksisterendeSakSection
                        harEksisterendeSak={harEksisterendeSak}
                        eksisterendeSak={eksisterendeSak}
                        partISakenNavn={partISaken?.navn ?? ""}
                        motpartNavn={motpart.navn}
                    />
                </div>

                {isLoadingHentSak && <LasterSkeleton tekst="Henter sak..." />}

                <div className="border-t border-ax-neutral-300" />

                <BarnSection
                    form={form}
                    barnkurver={barnkurver}
                    aktivKurvId={aktivKurvId}
                    erBidragspliktig={erBidragspliktig}
                    visReellMottaker={true}
                    bidragsmottakerErUkjent={bidragsmottakerErUkjent}
                    onResetMotpart={resetMotpart}
                />

                <div className="border-t border-ax-neutral-300" />

                <MotpartSection
                    form={form}
                    onSettMotpartUkjent={settMotpartUkjent}
                    onLeggTilMotpartManuell={leggTilMotpartManuell}
                    bidragsmottakerRegistreringRef={bidragsmottakerRegistreringRef}
                    visOppsummering={valgteBarn.length > 0}
                />

                {visValideringsAlerts && (
                    <>
                        <div className="border-t border-ax-neutral-300" />
                        <ValideringsAlertsSection
                            visUfullstendigRelasjonAlert={
                                valgteBarn.length > 0 && (bidragsmottakerErUkjent || !harValgteBarnRelasjonTilMotpart)
                            }
                            visBMUtenBarnAlert={erBidragsmottaker && valgteBarn.length === 0}
                            visKanIkkeOppretteSakAlert={
                                bidragsmottakerErUkjent && !sjekkerTilgangUtenBm && kanOppretteSakUtenBm === false
                            }
                        />
                    </>
                )}

                <div className="border-t border-ax-neutral-300" />

                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    disabled={
                        harEksisterendeSak ||
                        isLoadingHentSak ||
                        isLoadingEnhet ||
                        (bidragsmottakerErUkjent && (sjekkerTilgangUtenBm || kanOppretteSakUtenBm !== true))
                    }
                    submitError={error}
                    saksnummer={saksnummer}
                />
            </VStack>
        </Box>
    );
}
