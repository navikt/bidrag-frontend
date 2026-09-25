import { Rolletype } from "@bidrag/api/SakApi";
import { sakskategoriTilEnum } from "@bidrag/utils/visningsnavnUtils";
import { useEffect, useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useSjekkTilgangOpprettSakUtenBm } from "~/api/useApi.ts";
import { useEksisterendeSakSjekk } from "../eksisterende-sak/useEksisterendeSakSjekk";
import type { BarnebidragForelderRolle, BarnMedAlder, ForelderPartRolle, Motpart } from "../skjema/opprett-sak-schema";
import type { EnhetOgSubmitSectionProps } from "./EnhetOgSubmitSection";
import type { OpprettSakParter, OpprettSakRolle } from "./opprett-sak-request";
import { useBestemEnhet } from "./useBestemEnhet";
import { useOpprettSakHandling } from "./useOpprettSakHandling";

type FormMedKategori = FieldValues & { kategori: "Nasjonal" | "Utland" };

type UseFlowSubmissionProps<T extends FormMedKategori> = {
    form: UseFormReturn<T>;
    /**
     * `erKjent` styrer duplikatsjekken: `true`/`false` er avklart (kjent part / bevisst ukjent part)
     * og lar sjekken kjøre, mens `undefined` betyr «ikke avklart ennå» og holder den av.
     */
    valgteBarn?: BarnMedAlder[];
    arbeidsfordeling?: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
    erEktefellebidrag?: boolean;
    roller: BarnebidragForelderRolle[];
};

function tilEksisterendeSakPart(part: Motpart, rolle: ForelderPartRolle) {
    return { ident: part.ident ?? "", navn: part.navn ?? "", rolle, erKjent: part.erKjent };
}

/** Saker slås opp på BP, eller på BM når BP ikke er kjent. */
function eksisterendeSakParter(bidragspliktig: Motpart, bidragsmottaker: Motpart) {
    const bp = tilEksisterendeSakPart(bidragspliktig, "bidragspliktig");
    const bm = tilEksisterendeSakPart(bidragsmottaker, "bidragsmottaker");
    return bp.ident ? { partISaken: bp, motpart: bm } : { partISaken: bm, motpart: bp };
}

function useTilgangUtenBm(
    bidragsmottaker: { erKjent?: boolean } | null,
    arbeidsfordeling: UseFlowSubmissionProps<FormMedKategori>["arbeidsfordeling"],
) {
    const erBarnebidrag = !arbeidsfordeling || arbeidsfordeling === "EEN";
    const erUkjent = erBarnebidrag && bidragsmottaker?.erKjent === false;
    const { data: kanOpprette, isLoading } = useSjekkTilgangOpprettSakUtenBm(erUkjent);
    return {
        blokkert: erUkjent && (isLoading || kanOpprette !== true),
        mangler: erUkjent && !isLoading && kanOpprette === false,
    };
}

function useSendInn<T extends FormMedKategori>(
    form: UseFormReturn<T>,
    innsending: ReturnType<typeof useOpprettSakHandling>,
    parter: Omit<OpprettSakParter, "kategori">,
) {
    const { opprettSak, isLoading, saksnummer, nullstillResultat } = innsending;
    const senderInn = useRef(false);

    useEffect(() => {
        const abonnement = form.watch(() => {
            form.clearErrors();
            nullstillResultat();
        });
        return () => abonnement.unsubscribe();
    }, [form, nullstillResultat]);

    return form.handleSubmit(async (data) => {
        if (senderInn.current || isLoading || saksnummer) return;
        senderInn.current = true;
        try {
            await opprettSak({ kategori: data.kategori, ...parter });
        } finally {
            senderInn.current = false;
        }
    });
}

/**
 * Felles innsending for alle flyter: enhet, sjekk av eksisterende sak og tilgang, ut fra partene i skjemaet.
 *
 * 🔴 Tilgang til å opprette barnebidragssak uten BM håndheves bare her, ikke i bidrag-sak.
 * Sjekken gjelder bare EEN: oppfostring (OPS) har aldri BM, og farskap og ektefelle har alltid BM.
 */
export function useFlowSubmission<T extends FormMedKategori>({
    form,
    roller,
    valgteBarn = [],
    arbeidsfordeling,
    erEktefellebidrag,
}: UseFlowSubmissionProps<T>) {
    const { bidragspliktig: valgtBidragspliktig, bidragsmottaker: valgtBidragsmottaker } = parterFraRoller(roller);
    const {
        enhet,
        enhetNavn,
        isLoading: isLoadingEnhet,
        error: enhetError,
    } = useBestemEnhet({
        bidragspliktig: valgtBidragspliktig,
        bidragsmottaker: valgtBidragsmottaker,
        barn: valgteBarn,
        arbeidsfordeling,
        sakskategori: sakskategoriTilEnum((form as UseFormReturn<FormMedKategori>).watch("kategori")) || undefined,
    });

    const tilgangUtenBm = useTilgangUtenBm(valgtBidragsmottaker, arbeidsfordeling);

    const {
        harEksisterendeSak,
        eksisterendeSak,
        isLoading: isLoadingHentSak,
        infoMelding,
    } = useEksisterendeSakSjekk({
        ...eksisterendeSakParter(valgtBidragspliktig, valgtBidragsmottaker),
        erEktefellebidrag,
    });

    const opprettSak = useOpprettSakHandling({ enhet: enhet ?? "", arbeidsfordeling: arbeidsfordeling ?? "EEN" });
    const parter = {
        bidragspliktig: valgtBidragspliktig,
        bidragsmottaker: valgtBidragsmottaker,
        barn: valgteBarn,
        roller: lagRoller(roller, valgteBarn),
    };
    const onSubmit = useSendInn(form, opprettSak, parter);

    const innsending: EnhetOgSubmitSectionProps = {
        enhet,
        enhetNavn,
        isLoadingEnhet,
        enhetError,
        blocked: harEksisterendeSak || isLoadingHentSak || isLoadingEnhet || !enhet || tilgangUtenBm.blokkert,
        manglerTilgangUtenBm: tilgangUtenBm.mangler,
        oppsummering: parter,
        submitError: opprettSak.error,
        isLoading: opprettSak.isLoading,
        saksnummer: opprettSak.saksnummer,
    };

    return {
        onSubmit,
        sakStatus: { infoMelding, harEksisterendeSak, eksisterendeSak, isLoading: isLoadingHentSak },
        innsending,
    };
}

function parterFraRoller(roller: BarnebidragForelderRolle[]) {
    return {
        bidragspliktig: partFraRolle(roller.find((rolle) => rolle.type === "BP")),
        bidragsmottaker: partFraRolle(roller.find((rolle) => rolle.type === "BM")),
    };
}

function partFraRolle(rolle: BarnebidragForelderRolle | undefined): Motpart {
    return {
        ident: rolle?.ident,
        navn: rolle?.navn,
        erKjent: rolle?.erKjent,
        diskresjonskode: rolle?.diskresjonskode,
    };
}

function lagRoller(barnebidragRoller: BarnebidragForelderRolle[], barn: BarnMedAlder[]): OpprettSakRolle[] {
    const foreldre = barnebidragRoller.map((rolle) => ({
        type: rolle.type === "BP" ? Rolletype.BP : Rolletype.BM,
        fodselsnummer: rolle.ident,
    }));
    return [
        ...foreldre,
        ...barn.map((barnRolle) => ({
            type: Rolletype.BA,
            fodselsnummer: barnRolle.ident,
            reellMottaker: barnRolle.reellMottaker ? { ident: barnRolle.reellMottaker, verge: false } : null,
        })),
    ];
}
