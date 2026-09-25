import { sakskategoriTilEnum } from "@bidrag/utils/visningsnavnUtils";
import { useEffect, useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useSjekkTilgangOpprettSakUtenBm } from "~/api/useApi.ts";
import type { OpprettSakParter } from "../opprett-sak-request";
import type { BarnMedAlder, Motpart, PartISaken } from "../opprett-sak-schema";
import type { EnhetOgSubmitSectionProps } from "../sections/EnhetOgSubmitSection";
import { useBestemEnhet } from "./useBestemEnhet";
import { useEksisterendeSakSjekk } from "./useEksisterendeSakSjekk";
import { useOpprettSakHandling } from "./useOpprettSakHandling";

type FormMedKategori = FieldValues & { kategori: "Nasjonal" | "Utland" };

export type EksisterendeSakPart = {
    ident: string;
    navn: string;
    rolle: string;
    erKjent: boolean | undefined;
};

interface UseFlowSubmissionProps<T extends FormMedKategori> {
    form: UseFormReturn<T>;
    partISaken: PartISaken;
    /**
     * Motparten flyten jobber med. `erKjent` styrer duplikatsjekken:
     * `true`/`false` er avklart (kjent motpart / bevisst ukjent motpart) og lar
     * sjekken kjøre, mens `undefined` betyr «ikke avklart ennå» og holder den av.
     *
     * Flyter uten motpartsbegrep utelater feltet og oppgir i stedet partene
     * direkte via `eksisterendeSakPartISaken`/`eksisterendeSakMotpart`.
     *
     * `null` er bevisst ikke tillatt: det uttrykker «ingen informasjon» og slo
     * stilltiende av duplikatsjekken selv i flyter som visste at motparten var
     * ukjent (jf. Farskap og Oppfostringsbidrag).
     */
    motpart?: Motpart;
    valgteBarn?: BarnMedAlder[];
    arbeidsfordeling?: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
    erEktefellebidrag?: boolean;
    bidragspliktig?: Motpart | null;
    bidragsmottaker?: Motpart | null;
    eksisterendeSakPartISaken?: EksisterendeSakPart | null;
    eksisterendeSakMotpart?: EksisterendeSakPart | null;
}

export function lagEksisterendeSakPart(
    person: { ident?: string; navn?: string; erKjent?: boolean },
    rolle: string,
): EksisterendeSakPart {
    return {
        ident: person.ident ?? "",
        navn: person.navn ?? "",
        rolle,
        erKjent: person.erKjent,
    };
}

function partMedRolle(rolle: PartISaken["rolle"], partISaken: PartISaken, motpart?: Motpart) {
    return (partISaken.rolle === rolle ? partISaken : motpart) ?? null;
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
 * Reusable hook for flow submission logic.
 * Handles enhet determination, existing case check, and form submission.
 * Type-safe and works with any form schema.
 *
 * 🔴 Tilgang til å opprette barnebidragssak uten BM håndheves bare her, ikke i bidrag-sak.
 * Sjekken gjelder bare EEN: oppfostring (OPS) har aldri BM, og farskap og ektefelle har alltid BM.
 */
export function useFlowSubmission<T extends FormMedKategori>({
    form,
    partISaken,
    motpart,
    valgteBarn = [],
    arbeidsfordeling,
    erEktefellebidrag,
    bidragspliktig,
    bidragsmottaker,
    eksisterendeSakPartISaken,
    eksisterendeSakMotpart,
}: UseFlowSubmissionProps<T>) {
    const resolvedBidragspliktig = bidragspliktig ?? partMedRolle("bidragspliktig", partISaken, motpart);
    const resolvedBidragsmottaker = bidragsmottaker ?? partMedRolle("bidragsmottaker", partISaken, motpart);

    const {
        enhet,
        enhetNavn,
        isLoading: isLoadingEnhet,
        error: enhetError,
    } = useBestemEnhet({
        bidragspliktig: resolvedBidragspliktig,
        bidragsmottaker: resolvedBidragsmottaker,
        barn: valgteBarn,
        arbeidsfordeling,
        sakskategori: sakskategoriTilEnum((form as UseFormReturn<FormMedKategori>).getValues("kategori")) || undefined,
    });

    const tilgangUtenBm = useTilgangUtenBm(resolvedBidragsmottaker, arbeidsfordeling);

    const safePartISaken = eksisterendeSakPartISaken ?? lagEksisterendeSakPart(partISaken, partISaken.rolle);
    const safeMotpart = eksisterendeSakMotpart ?? lagEksisterendeSakPart(motpart ?? {}, motpart?.rolle ?? "");
    const {
        harEksisterendeSak,
        eksisterendeSak,
        isLoading: isLoadingHentSak,
        infoMelding,
    } = useEksisterendeSakSjekk({
        partISaken: safePartISaken,
        motpart: safeMotpart,
        erEktefellebidrag,
    });

    const opprettSak = useOpprettSakHandling({ enhet: enhet ?? "", arbeidsfordeling: arbeidsfordeling ?? "EEN" });
    const parter = {
        bidragspliktig: resolvedBidragspliktig,
        bidragsmottaker: resolvedBidragsmottaker,
        barn: valgteBarn,
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
