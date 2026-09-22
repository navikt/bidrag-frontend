import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, VStack } from "@navikt/ds-react";
import { useEffect, useRef } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useSjekkTilgangOpprettSakUtenBm } from "~/api/useApi.ts";
import BMUtenBarnAlert from "../../components/BMUtenBarnAlert";
import KanIkkeOppretteSakAlert from "../../components/KanIkkeOppretteSakAlert";
import LasterSkeleton from "../../components/LasterSkeleton";
import FlytSkjema from "../../felles/FlytSkjema";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import { useMotpartHandling } from "../../hooks/useMotpartHandling";
import useSyncKategori from "../../hooks/useSyncKategori";
import {
    type ForelderMedBarnSkjemaData,
    ForelderMedBarnSkjemaSchema,
    type ForelderPartRolle,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";
import EksisterendeSakSection from "../../sections/EksisterendeSakSection";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import MotpartSection from "../../sections/MotpartSection";
import UfullstendigRelasjonAlert from "../../UfullstendigRelasjonAlert";
import { grupperBarnIKurver, hentMotsattRolle } from "../../utils";

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
    const { partISaken, saksrolleFlyt } = useSaksrolleroversikt();
    const form = useFormContext<ForelderMedBarnSkjemaData>();
    useSyncKategori(form);
    const bidragsmottakerRegistreringRef = useRef<HTMLDialogElement>(null);
    const rawBarnkurver = saksrolleFlyt?.type === "FORELDER_MED_BARN" ? saksrolleFlyt.barnkurver : [];
    const barnkurver = grupperBarnIKurver(rawBarnkurver);

    useEffect(() => {
        if (partISaken) {
            form.setValue("partISaken.rolle", partISaken.rolle);
        }
    }, [partISaken]);

    const valgteBarn = form.watch("valgteBarn");
    const motpart = form.watch("motpart");

    const { settMotpartUkjent, leggTilMotpartManuell } = useMotpartHandling(form);

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
        <FlytSkjema onSubmit={onSubmit}>
            <VStack gap="space-6">
                <VStack gap="space-12">
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
                </VStack>

                {isLoadingHentSak && <LasterSkeleton tekst="Henter sak..." />}

                <BarnSection
                    form={form}
                    barnkurver={barnkurver}
                    erBidragspliktig={erBidragspliktig}
                    reellMottakerRegel={{ type: "etter-barn", bidragsmottakerErUkjent }}
                    onResetMotpart={resetMotpart}
                />

                <MotpartSection
                    form={form}
                    onSettMotpartUkjent={settMotpartUkjent}
                    onLeggTilMotpartManuell={leggTilMotpartManuell}
                    bidragsmottakerRegistreringRef={bidragsmottakerRegistreringRef}
                />

                {visValideringsAlerts && (
                    <>
                        {valgteBarn.length > 0 && (bidragsmottakerErUkjent || !harValgteBarnRelasjonTilMotpart) && (
                            <UfullstendigRelasjonAlert />
                        )}
                        {erBidragsmottaker && valgteBarn.length === 0 && <BMUtenBarnAlert />}
                        {bidragsmottakerErUkjent && !sjekkerTilgangUtenBm && kanOppretteSakUtenBm === false && (
                            <KanIkkeOppretteSakAlert />
                        )}
                    </>
                )}

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
        </FlytSkjema>
    );
}
