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
    motpart?: Motpart | null;
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
    motpart = null,
    valgteBarn = [],
    arbeidsfordeling,
    bidragspliktig,
    bidragsmottaker,
    eksisterendeSakPartISaken,
    eksisterendeSakMotpart,
}: UseFlowSubmissionProps<T>) {
    const resolvedBidragspliktig = bidragspliktig ?? (partISaken.rolle === "bidragspliktig" ? partISaken : motpart);
    const resolvedBidragsmottaker = bidragsmottaker ?? (partISaken.rolle === "bidragsmottaker" ? partISaken : motpart);

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
    });

    const {
        opprettSakFraSkjema,
        opprettEktefellebidragSak,
        isLoading: isLoadingOpprettSak,
        error,
        saksnummer,
    } = useOpprettSakHandling({ enhet: enhet ?? "", arbeidsfordeling: arbeidsfordeling ?? "EEN" });

    const onSubmit = form.handleSubmit(async (data) => {
        console.log(data);
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
