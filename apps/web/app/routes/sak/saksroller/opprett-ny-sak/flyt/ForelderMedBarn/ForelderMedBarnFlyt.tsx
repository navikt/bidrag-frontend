import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useSjekkTilgangOpprettSakUtenBm } from "~/api/useApi.ts";
import BMUtenBarnAlert from "../../components/BMUtenBarnAlert";
import KanIkkeOppretteSakAlert from "../../components/KanIkkeOppretteSakAlert";
import RolleFlytSide from "../../felles/RolleFlytSide";
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
    const rawBarnkurver = saksrolleFlyt?.type === "FORELDER_MED_BARN" ? saksrolleFlyt.barnkurver : [];
    const barnkurver = grupperBarnIKurver(rawBarnkurver);

    useEffect(() => {
        if (partISaken) {
            form.setValue("partISaken.rolle", partISaken.rolle);
        }
    }, [partISaken]);

    const valgteBarn = form.watch("valgteBarn");
    const motpart = form.watch("motpart");

    const { leggTilMotpartManuell } = useMotpartHandling(form);

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
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{
                infoMelding: eksisterendeSakInfoMelding,
                harEksisterendeSak,
                eksisterendeSak,
                isLoading: isLoadingHentSak,
                partISakenNavn: partISaken?.navn ?? "",
                motpartNavn: motpart.navn,
            }}
            meldinger={
                visValideringsAlerts ? (
                    <>
                        {valgteBarn.length > 0 && (bidragsmottakerErUkjent || !harValgteBarnRelasjonTilMotpart) && (
                            <UfullstendigRelasjonAlert />
                        )}
                        {erBidragsmottaker && valgteBarn.length === 0 && <BMUtenBarnAlert />}
                        {bidragsmottakerErUkjent && !sjekkerTilgangUtenBm && kanOppretteSakUtenBm === false && (
                            <KanIkkeOppretteSakAlert />
                        )}
                    </>
                ) : undefined
            }
            submit={
                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    blocked={
                        harEksisterendeSak ||
                        isLoadingHentSak ||
                        isLoadingEnhet ||
                        (bidragsmottakerErUkjent && (sjekkerTilgangUtenBm || kanOppretteSakUtenBm !== true))
                    }
                    submitError={error}
                    isLoading={isLoadingOpprettSak}
                    saksnummer={saksnummer}
                />
            }
        >
            <BarnSection
                form={form}
                barnkurver={barnkurver}
                reellMottakerRegel={{ type: "etter-barn", bidragsmottakerErUkjent }}
                onResetMotpart={resetMotpart}
            />

            <MotpartSection form={form} onLeggTilMotpartManuell={leggTilMotpartManuell} />
        </RolleFlytSide>
    );
}
