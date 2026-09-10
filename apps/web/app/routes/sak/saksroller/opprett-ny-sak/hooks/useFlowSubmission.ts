import { arbeidsfordelingMap } from "@bidrag/utils/organisasjonUtils";
import { sakskategoriTilEnum } from "@bidrag/utils/visningsnavnUtils";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type {
    BarnMedAlder,
    BarnMedReellMottaker,
    EktefellebidragSkjemaData,
    ForelderMedRolle,
    Motpart,
    PartISaken,
} from "../opprett-sak-schema";
import { useBestemEnhet } from "./useBestemEnhet";
import { useEksisterendeSakSjekk } from "./useEksisterendeSakSjekk";
import { useOpprettSakHandling } from "./useOpprettSakHandling";

type FormMedKategori = FieldValues & { kategori?: string };

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
    eksisterendeSakPartISaken?: { ident: string; navn: string; rolle: string; erKjent: boolean | undefined } | null;
    eksisterendeSakMotpart?: { ident: string; navn: string; rolle: string; erKjent: boolean | undefined } | null;
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
    const resolvedBidragspliktig =
        bidragspliktig ?? (partISaken.rolle === "bidragspliktig" ? partISaken : motpart) ?? null;
    const resolvedBidragsmottaker =
        bidragsmottaker ?? (partISaken.rolle === "bidragsmottaker" ? partISaken : motpart) ?? null;

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

    const safePartISaken = eksisterendeSakPartISaken ?? {
        ident: partISaken.ident,
        navn: partISaken.navn,
        rolle: partISaken.rolle,
        erKjent: partISaken.erKjent,
    };
    const safeMotpart = eksisterendeSakMotpart ?? {
        ident: motpart?.ident ?? "",
        navn: motpart?.navn ?? "",
        rolle: motpart?.rolle ?? "",
        erKjent: motpart?.erKjent,
    };
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
    } = useOpprettSakHandling({ enhet: enhet ?? "", arbeidsfordeling: arbeidsfordeling ?? "EEN" });

    const onSubmit = form.handleSubmit(async (data) => {
        if (arbeidsfordeling === arbeidsfordelingMap.EKTEFELLLESAK.kode) {
            await opprettEktefellebidragSak(data as unknown as EktefellebidragSkjemaData);
            return;
        }

        await opprettSakFraSkjema(data as never);
    });

    return {
        enhet,
        enhetNavn,
        isLoadingEnhet,
        enhetError,
        harEksisterendeSak,
        eksisterendeSak,
        isLoadingHentSak,
        infoMelding,
        onSubmit,
        isLoadingOpprettSak,
        error,
        saksnummer,
    };
}
