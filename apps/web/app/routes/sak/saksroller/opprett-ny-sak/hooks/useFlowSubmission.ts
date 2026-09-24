import { arbeidsfordelingMap } from "@bidrag/utils/organisasjonUtils";
import { sakskategoriTilEnum } from "@bidrag/utils/visningsnavnUtils";
import { useEffect, useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import {
    type BarnMedAlder,
    type BarnMedReellMottaker,
    EktefellebidragSkjemaSchema,
    type ForelderMedRolle,
    type Motpart,
    type PartISaken,
} from "../opprett-sak-schema";
import type { EnhetOgSubmitSectionProps } from "../sections/EnhetOgSubmitSection";
import { useBestemEnhet } from "./useBestemEnhet";
import { useEksisterendeSakSjekk } from "./useEksisterendeSakSjekk";
import { useOpprettSakHandling } from "./useOpprettSakHandling";

type FormMedKategori = FieldValues & { kategori?: string };

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
    valgteBarn?: BarnMedAlder[] | BarnMedReellMottaker;
    arbeidsfordeling?: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
    erEktefellebidrag?: boolean;
    bidragspliktig?: PartISaken | Motpart | ForelderMedRolle | null;
    bidragsmottaker?: PartISaken | Motpart | ForelderMedRolle | null;
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

/**
 * Reusable hook for flow submission logic.
 * Handles enhet determination, existing case check, and form submission.
 * Type-safe and works with any form schema.
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

    const {
        opprettSakFraSkjema,
        opprettEktefellebidragSak,
        isLoading: isLoadingOpprettSak,
        error,
        saksnummer,
        nullstillResultat,
    } = useOpprettSakHandling({ enhet: enhet ?? "", arbeidsfordeling: arbeidsfordeling ?? "EEN" });
    const senderInn = useRef(false);

    useEffect(() => {
        const abonnement = form.watch(() => {
            form.clearErrors();
            nullstillResultat();
        });

        return () => abonnement.unsubscribe();
    }, [form, nullstillResultat]);

    const onSubmit = form.handleSubmit(async (data) => {
        if (senderInn.current || isLoadingOpprettSak || saksnummer) return;
        senderInn.current = true;
        try {
            if (arbeidsfordeling === arbeidsfordelingMap.EKTEFELLLESAK.kode) {
                const result = EktefellebidragSkjemaSchema.safeParse(data);
                if (!result.success) {
                    throw new Error("Ukjent skjematype");
                }
                await opprettEktefellebidragSak(result.data);
                return;
            }

            await opprettSakFraSkjema(data);
        } finally {
            senderInn.current = false;
        }
    });

    const innsending: EnhetOgSubmitSectionProps = {
        enhet,
        enhetNavn,
        isLoadingEnhet,
        enhetError,
        blocked: harEksisterendeSak || isLoadingHentSak || isLoadingEnhet,
        submitError: error,
        isLoading: isLoadingOpprettSak,
        saksnummer,
    };

    return {
        onSubmit,
        harEksisterendeSak,
        isLoadingHentSak,
        isLoadingEnhet,
        sakStatus: { infoMelding, harEksisterendeSak, eksisterendeSak, isLoading: isLoadingHentSak },
        innsending,
    };
}
