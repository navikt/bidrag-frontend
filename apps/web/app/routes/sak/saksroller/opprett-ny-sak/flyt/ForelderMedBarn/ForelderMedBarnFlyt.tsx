import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";
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

    const erBidragsmottaker = partISaken?.rolle === "bidragsmottaker";
    const { bidragsmottaker, bidragspliktig } = fordelRoller(partISaken, motpart);

    const resetMotpart = () => {
        form.setValue("motpart", {
            ident: "",
            navn: "",
            erKjent: false,
            rolle: form.getValues("motpart.rolle"),
            diskresjonskode: undefined,
        });
    };
    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        partISaken: { ...form.watch("partISaken"), erKjent: true },
        motpart,
        valgteBarn,
        bidragspliktig,
        bidragsmottaker,
    });

    const bidragsmottakerErUkjent = bidragsmottaker?.erKjent === false;
    const tilgangUtenBm = useTilgangUtenBm(bidragsmottakerErUkjent);

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{
                ...sakStatus,
                partISakenNavn: partISaken?.navn || "",
                motpartNavn: motpart.navn,
            }}
            meldinger={
                <ForelderMedBarnMeldinger
                    harValgteBarn={valgteBarn.length > 0}
                    erBidragsmottaker={erBidragsmottaker}
                    harFullstendigRelasjon={
                        !bidragsmottakerErUkjent &&
                        finnMotpartIdentForValgteBarn(rawBarnkurver, valgteBarn) === motpart.ident
                    }
                    manglerTilgangUtenBm={tilgangUtenBm.avslått}
                />
            }
            submit={<EnhetOgSubmitSection {...innsending} blocked={innsending.blocked || tilgangUtenBm.blokkerer} />}
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

function finnMotpartIdentForValgteBarn(barnkurver: MotpartBarnRelasjon[], valgteBarn: { ident: string }[]) {
    const valgteIdenter = new Set(valgteBarn.map((barn) => barn.ident));
    return barnkurver.find((kurv) => kurv.fellesBarn.some((barn) => valgteIdenter.has(barn.ident)))?.motpart?.ident;
}

function fordelRoller<P extends { rolle?: string | null }, M>(partISaken: P | null | undefined, motpart: M) {
    const partErBidragsmottaker = partISaken?.rolle === "bidragsmottaker";
    const partErBidragspliktig = partISaken?.rolle === "bidragspliktig";
    return {
        bidragsmottaker: partErBidragsmottaker ? partISaken : motpart,
        bidragspliktig: partErBidragspliktig ? partISaken : motpart,
    };
}

function useTilgangUtenBm(bidragsmottakerErUkjent: boolean) {
    const { data: kanOpprette, isLoading } = useSjekkTilgangOpprettSakUtenBm(bidragsmottakerErUkjent);
    return {
        blokkerer: bidragsmottakerErUkjent && (isLoading || kanOpprette !== true),
        avslått: bidragsmottakerErUkjent && !isLoading && kanOpprette === false,
    };
}

function ForelderMedBarnMeldinger({
    harValgteBarn,
    erBidragsmottaker,
    harFullstendigRelasjon,
    manglerTilgangUtenBm,
}: {
    harValgteBarn: boolean;
    erBidragsmottaker: boolean;
    harFullstendigRelasjon: boolean;
    manglerTilgangUtenBm: boolean;
}) {
    const visUfullstendigRelasjon = harValgteBarn && !harFullstendigRelasjon;
    const visManglendeBarn = erBidragsmottaker && !harValgteBarn;

    if (!visUfullstendigRelasjon && !visManglendeBarn && !manglerTilgangUtenBm) {
        return undefined;
    }

    return (
        <>
            {visUfullstendigRelasjon && <UfullstendigRelasjonAlert />}
            {visManglendeBarn && <BMUtenBarnAlert />}
            {manglerTilgangUtenBm && <KanIkkeOppretteSakAlert />}
        </>
    );
}
