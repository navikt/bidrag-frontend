import type { TilgangsFeilError } from "@bidrag/api";
import { Arbeidsfordeling, type OpprettSakRequest, type RolleDto, Rolletype } from "@bidrag/api/SakApi";
import { arbeidsfordelingMap } from "@bidrag/utils/organisasjonUtils";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { useOpprettSak } from "~/api/useApi.ts";
import {
    type BarnBeggForeldreSkjemaData,
    BarnBeggForeldreSkjemaSchema,
    type BarnMedManglendeForeldreSkjemaData,
    BarnMedManglendeForeldreSkjemaSchema,
    type EktefellebidragSkjemaData,
    FarskapsSkjemaSchema,
    type FarskapsSkjemaSchemaData,
    type ForelderMedBarnSkjemaData,
    ForelderMedBarnSkjemaSchema,
    type ForelderUtenBarnSkjemaData,
    ForelderUtenBarnSkjemaSchema,
    OppfostringsbidragSkjemaSchema,
    type OppfostringsbidragSkjemaSchemaData,
} from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";

type SaksrollerArbeidsfordeling = "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
type OpprettetSakRolle = Omit<RolleDto, "rollehistorikk">;
type ForelderSakSkjemaData = ForelderMedBarnSkjemaData | ForelderUtenBarnSkjemaData;
type BarnSakSkjemaData = BarnBeggForeldreSkjemaData | BarnMedManglendeForeldreSkjemaData;
type ParsedSakSkjema =
    | { type: "FARSKAP"; data: FarskapsSkjemaSchemaData }
    | { type: "OPPFOSTRINGSBIDRAG"; data: OppfostringsbidragSkjemaSchemaData }
    | { type: "FORELDER"; data: ForelderSakSkjemaData }
    | { type: "BARN"; data: BarnSakSkjemaData };

type OpprettSakHandlingResult = {
    opprettSakFraSkjema: (data: unknown) => Promise<void>;
    opprettEktefellebidragSak: (data: EktefellebidragSkjemaData) => Promise<void>;
    saksnummer: string | null;
    isLoading: boolean;
    error: AxiosError<string> | TilgangsFeilError | null;
    nullstillResultat: () => void;
};

type Props = {
    enhet: string;
    arbeidsfordeling: SaksrollerArbeidsfordeling;
};

const arbeidsfordelingTilEnum: Record<SaksrollerArbeidsfordeling, Arbeidsfordeling> = {
    BBF: Arbeidsfordeling.BBF,
    EEN: Arbeidsfordeling.EEN,
    EFS: Arbeidsfordeling.EFS,
    FRS: Arbeidsfordeling.FRS,
    INH: Arbeidsfordeling.INH,
    OPS: Arbeidsfordeling.OPS,
};

function lagBaseRequest(
    enhet: string,
    kategori: "Nasjonal" | "Utland",
    arbeidsfordeling: SaksrollerArbeidsfordeling = "EEN",
): Omit<OpprettSakRequest, "roller"> {
    return {
        eierfogd: enhet,
        kategori: kategori === "Nasjonal" ? "N" : "U",
        arbeidsfordeling: arbeidsfordelingTilEnum[arbeidsfordeling],
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
    };
}

function lagPersonRolle(fodselsnummer: string | undefined, type: Rolletype): OpprettetSakRolle {
    return {
        fodselsnummer,
        type,
        mottagerErVerge: false,
        rolleType: type,
    };
}

function lagBarnRolle(barn: { ident: string; reellMottaker?: string }): OpprettetSakRolle {
    return {
        fodselsnummer: barn.ident,
        type: Rolletype.BA,
        rolleType: Rolletype.BA,
        reellMottaker: barn.reellMottaker
            ? {
                  ident: barn.reellMottaker,
                  verge: false,
              }
            : null,
        mottagerErVerge: false,
    };
}

function lagOpprettSakRequest(base: Omit<OpprettSakRequest, "roller">, roller: OpprettetSakRolle[]): OpprettSakRequest {
    return { ...base, roller } as OpprettSakRequest;
}

function lagForelderRequest(enhet: string, data: ForelderSakSkjemaData): OpprettSakRequest {
    const [bidragsmottaker, bidragspliktig] =
        data.motpart.rolle === "bidragsmottaker" ? [data.motpart, data.partISaken] : [data.partISaken, data.motpart];

    return lagOpprettSakRequest(lagBaseRequest(enhet, data.kategori, "EEN"), [
        lagPersonRolle(bidragspliktig.ident, Rolletype.BP),
        lagPersonRolle(bidragsmottaker.ident, Rolletype.BM),
        ...data.valgteBarn.map(lagBarnRolle),
    ]);
}

function lagBarnRequest(enhet: string, arbeidsfordeling: SaksrollerArbeidsfordeling, data: BarnSakSkjemaData) {
    const bidragspliktig = data.foreldre.find((f) => f.rolle === "bidragspliktig");
    const bidragsmottaker = data.foreldre.find((f) => f.rolle === "bidragsmottaker");

    if (!bidragspliktig || !bidragsmottaker) {
        throw new Error("Mangler bidragspliktig eller bidragsmottaker");
    }

    return lagOpprettSakRequest(lagBaseRequest(enhet, data.kategori, arbeidsfordeling), [
        lagPersonRolle(bidragspliktig.ident, Rolletype.BP),
        lagPersonRolle(bidragsmottaker.ident, Rolletype.BM),
        lagBarnRolle(data.barn),
    ]);
}

function parseSakSkjema(data: unknown, arbeidsfordeling: SaksrollerArbeidsfordeling): ParsedSakSkjema {
    if (arbeidsfordeling === arbeidsfordelingMap.FARSKAP.kode) {
        const result = FarskapsSkjemaSchema.safeParse(data);
        if (result.success) return { type: "FARSKAP", data: result.data };
        throw new Error("Ukjent skjematype");
    }

    if (arbeidsfordeling === arbeidsfordelingMap.OPPFOSTRINGSSAK.kode) {
        const result = OppfostringsbidragSkjemaSchema.safeParse(data);
        if (result.success) return { type: "OPPFOSTRINGSBIDRAG", data: result.data };
        throw new Error("Ukjent skjematype");
    }

    const forelderMedBarnResult = ForelderMedBarnSkjemaSchema.safeParse(data);
    if (forelderMedBarnResult.success) return { type: "FORELDER", data: forelderMedBarnResult.data };

    const forelderUtenBarnResult = ForelderUtenBarnSkjemaSchema.safeParse(data);
    if (forelderUtenBarnResult.success) return { type: "FORELDER", data: forelderUtenBarnResult.data };

    const barnBeggForeldreResult = BarnBeggForeldreSkjemaSchema.safeParse(data);
    if (barnBeggForeldreResult.success) return { type: "BARN", data: barnBeggForeldreResult.data };

    const barnManglendeForeldreResult = BarnMedManglendeForeldreSkjemaSchema.safeParse(data);
    if (barnManglendeForeldreResult.success) return { type: "BARN", data: barnManglendeForeldreResult.data };

    throw new Error("Ukjent skjematype");
}

/**
 * Hook for å håndtere opprettelse av sak fra alle flyts
 * Konverterer skjemadata til OpprettSakRequest og sender til backend
 *
 * Håndterer:
 * - Automatisk valg av eierfogd basert på arbeidsfordeling
 * - Spesialbehandling for personer med fortrolig adresse (enhet 2103)
 * - Alle flyttyper: ForelderMedBarn, ForelderUtenBarn, BarnBeggForeldre, BarnMedManglendeForeldre
 *
 * @example
 * ```typescript
 * const { opprettSakFraSkjema, saksnummer, isLoading, error } = useOpprettSakHandling({ enhet });
 *
 * const onSubmit = async (data: ForelderMedBarnSkjemaData) => {
 *     await opprettSakFraSkjema(data);
 *     // Kaller ikke automatisk redirect - caller kontrollerer post-success handling
 * };
 * ```
 */
export function useOpprettSakHandling({ enhet, arbeidsfordeling }: Props): OpprettSakHandlingResult {
    const {
        data: saksnummer,
        error: mutationError,
        isPending,
        mutateAsync: opprettSak,
        reset: nullstillResultat,
    } = useOpprettSak();
    const { setIsLoadingOpprettSak } = useSaksrolleroversikt();

    useEffect(() => {
        setIsLoadingOpprettSak(isPending);
    }, [isPending, setIsLoadingOpprettSak]);

    const opprettSakFraSkjema = async (data: unknown) => {
        const skjema = parseSakSkjema(data, arbeidsfordeling);
        const request =
            skjema.type === "FORELDER"
                ? lagForelderRequest(enhet, skjema.data)
                : skjema.type === "BARN"
                  ? lagBarnRequest(enhet, arbeidsfordeling, skjema.data)
                  : null;

        if (skjema.type === "FARSKAP") {
            await opprettFarskapSak(skjema.data);
            return;
        }
        if (skjema.type === "OPPFOSTRINGSBIDRAG") {
            await opprettOppfostringssak(skjema.data);
            return;
        }
        if (!request) {
            throw new Error("Ukjent skjematype");
        }

        await opprettSak({
            ...request,
            roller: request.roller.filter((i) => i.fodselsnummer !== ""),
        });
    };

    const opprettOppfostringssak = async (data: OppfostringsbidragSkjemaSchemaData) => {
        setIsLoadingOpprettSak(true);
        const request = lagOpprettSakRequest(lagBaseRequest(enhet, data.kategori, data.arbeidsfordeling), [
            lagPersonRolle(data.partISaken.ident, Rolletype.BP),
            ...data.valgteBarn.map(lagBarnRolle),
        ]);

        await opprettSak({
            ...request,
        });
    };

    const opprettFarskapSak = async (data: FarskapsSkjemaSchemaData) => {
        setIsLoadingOpprettSak(true);
        const request = lagOpprettSakRequest(lagBaseRequest(enhet, data.kategori, data.arbeidsfordeling), [
            lagPersonRolle(data.partISaken.ident, Rolletype.BM),
            ...data.valgteBarn.map(lagBarnRolle),
        ]);

        await opprettSak({
            ...request,
        });
    };

    const opprettEktefellebidragSak = async (data: EktefellebidragSkjemaData) => {
        setIsLoadingOpprettSak(true);
        const request = lagOpprettSakRequest(lagBaseRequest(enhet, data.kategori, data.arbeidsfordeling), [
            lagPersonRolle(
                data.partISaken.ident,
                data.partISaken.rolle === "bidragspliktig" ? Rolletype.BP : Rolletype.BM,
            ),
            lagPersonRolle(data.motpart.ident, data.motpart.rolle === "bidragspliktig" ? Rolletype.BP : Rolletype.BM),
        ]);

        await opprettSak({
            ...request,
        });
    };

    return {
        opprettSakFraSkjema,
        opprettEktefellebidragSak,
        saksnummer: saksnummer || null,
        isLoading: isPending,
        error: mutationError || null,
        nullstillResultat,
    };
}
