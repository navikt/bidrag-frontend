import type { TilgangsFeilError } from "@bidrag/api";
import { type Arbeidsfordeling, type OpprettSakRequest, Rolletype } from "@bidrag/api/SakApi";
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
    type FarskapsSkjemaSchemaData,
    type ForelderMedBarnSkjemaData,
    ForelderMedBarnSkjemaSchema,
    type ForelderUtenBarnSkjemaData,
    ForelderUtenBarnSkjemaSchema,
    type OppfostringsbidragSkjemaSchemaData,
} from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";

type SakSkjemaData =
    | ForelderMedBarnSkjemaData
    | ForelderUtenBarnSkjemaData
    | BarnBeggForeldreSkjemaData
    | BarnMedManglendeForeldreSkjemaData;

type OpprettSakHandlingResult = {
    opprettSakFraSkjema: (data: SakSkjemaData) => Promise<void>;
    opprettEktefellebidragSak: (data: EktefellebidragSkjemaData) => Promise<void>;
    saksnummer: string | null;
    isLoading: boolean;
    error: AxiosError<string> | TilgangsFeilError | null;
};

type Props = {
    enhet: string;
    arbeidsfordeling: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
};

function lagBaseRequest(
    enhet: string,
    kategori: "Nasjonal" | "Utland",
    arbeidsfordeling: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS" = "EEN",
): Partial<OpprettSakRequest> {
    return {
        eierfogd: enhet,

        kategori: kategori === "Nasjonal" ? "N" : "U",
        arbeidsfordeling: arbeidsfordeling as Arbeidsfordeling,
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
    };
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
    const { data: saksnummer, error: mutationError, isPending, mutateAsync: opprettSak } = useOpprettSak();
    const { setIsLoadingOpprettSak } = useSaksrolleroversikt();

    useEffect(() => {
        setIsLoadingOpprettSak(isPending);
    }, [isPending, setIsLoadingOpprettSak]);

    const opprettSakFraSkjema = async (data: SakSkjemaData) => {
        let request: OpprettSakRequest;

        if (arbeidsfordeling === arbeidsfordelingMap.FARSKAP.kode) {
            await opprettFarskapSak(data as FarskapsSkjemaSchemaData);
            return;
        }
        if (arbeidsfordeling === arbeidsfordelingMap.OPPFOSTRINGSSAK.kode) {
            await opprettOppfostringssak(data as OppfostringsbidragSkjemaSchemaData);
            return;
        }
        const forelderMedBarnResult = ForelderMedBarnSkjemaSchema.safeParse(data);
        const forelderUtenBarnResult = ForelderUtenBarnSkjemaSchema.safeParse(data);

        if (forelderMedBarnResult.success || forelderUtenBarnResult.success) {
            const forelderData = data as ForelderMedBarnSkjemaData | ForelderUtenBarnSkjemaData;

            const [bidragsmottaker, bidragspliktig] =
                forelderData.motpart.rolle === "bidragsmottaker"
                    ? [forelderData.motpart, forelderData.partISaken]
                    : [forelderData.partISaken, forelderData.motpart];

            request = {
                ...lagBaseRequest(enhet, forelderData.kategori, "EEN"),
                roller: [
                    {
                        fodselsnummer: bidragspliktig.ident,
                        type: Rolletype.BP,
                        mottagerErVerge: false,
                        rolleType: Rolletype.BP,
                    },
                    {
                        fodselsnummer: bidragsmottaker.ident,
                        type: Rolletype.BM,
                        mottagerErVerge: false,
                        rolleType: Rolletype.BM,
                    },
                    ...forelderData.valgteBarn.map((barn) => ({
                        fodselsnummer: barn.ident,
                        type: Rolletype.BA,
                        rolleType: Rolletype.BA,
                        reellMottaker: barn?.reellMottaker
                            ? {
                                  ident: barn.reellMottaker ?? "",
                                  verge: false,
                              }
                            : null,
                        mottagerErVerge: false,
                    })),
                ],
            } as OpprettSakRequest;
        } else {
            const barnBeggForeldreResult = BarnBeggForeldreSkjemaSchema.safeParse(data);
            const barnManglendeForeldreResult = BarnMedManglendeForeldreSkjemaSchema.safeParse(data);

            if (barnBeggForeldreResult.success || barnManglendeForeldreResult.success) {
                const barnData = data as BarnBeggForeldreSkjemaData | BarnMedManglendeForeldreSkjemaData;

                const bidragspliktig = barnData.foreldre.find((f) => f.rolle === "bidragspliktig");
                const bidragsmottaker = barnData.foreldre.find((f) => f.rolle === "bidragsmottaker");

                if (!bidragspliktig || !bidragsmottaker) {
                    throw new Error("Mangler bidragspliktig eller bidragsmottaker");
                }

                request = {
                    ...lagBaseRequest(enhet, barnData.kategori, arbeidsfordeling),
                    roller: [
                        {
                            fodselsnummer: bidragspliktig.ident,
                            type: Rolletype.BP,
                            mottagerErVerge: false,
                            rolleType: Rolletype.BP,
                        },
                        {
                            fodselsnummer: bidragsmottaker.ident,
                            type: Rolletype.BM,
                            mottagerErVerge: false,
                            rolleType: Rolletype.BM,
                        },
                        {
                            fodselsnummer: barnData.barn.ident,
                            type: Rolletype.BA,
                            rolleType: Rolletype.BA,
                            reellMottaker: barnData.barn?.reellMottaker
                                ? {
                                      ident: barnData.barn.reellMottaker ?? "",
                                      verge: false,
                                  }
                                : null,
                            mottagerErVerge: false,
                        },
                    ],
                } as OpprettSakRequest;
            } else {
                throw new Error("Ukjent skjematype");
            }
        }

        await opprettSak({
            ...request,
            roller: request.roller.filter((i) => i.fodselsnummer !== ""),
        });
    };

    const opprettOppfostringssak = async (data: OppfostringsbidragSkjemaSchemaData) => {
        setIsLoadingOpprettSak(true);
        const request = {
            ...lagBaseRequest(enhet, data.kategori, data.arbeidsfordeling),
            roller: [
                {
                    fodselsnummer: data.partISaken.ident,
                    type: Rolletype.BP,
                    mottagerErVerge: false,
                    rolleType: Rolletype.BP,
                },
                ...data.valgteBarn.map((barn) => ({
                    fodselsnummer: barn.ident,
                    type: Rolletype.BA,
                    rolleType: Rolletype.BA,
                    reellMottaker: barn?.reellMottaker
                        ? {
                              ident: barn.reellMottaker ?? "",
                              verge: false,
                          }
                        : null,
                    mottagerErVerge: false,
                })),
            ],
        } as OpprettSakRequest;

        await opprettSak({
            ...request,
        });
    };

    const opprettFarskapSak = async (data: FarskapsSkjemaSchemaData) => {
        setIsLoadingOpprettSak(true);
        const request = {
            ...lagBaseRequest(enhet, data.kategori, data.arbeidsfordeling),
            roller: [
                {
                    fodselsnummer: data.partISaken.ident,
                    type: Rolletype.BM,
                    mottagerErVerge: false,
                    rolleType: Rolletype.BM,
                },
                ...data.valgteBarn.map((barn) => ({
                    fodselsnummer: barn.ident,
                    type: Rolletype.BA,
                    rolleType: Rolletype.BA,
                    reellMottaker: barn?.reellMottaker
                        ? {
                              ident: barn.reellMottaker ?? "",
                              verge: false,
                          }
                        : null,
                    mottagerErVerge: false,
                })),
            ],
        } as OpprettSakRequest;

        await opprettSak({
            ...request,
        });
    };

    const opprettEktefellebidragSak = async (data: EktefellebidragSkjemaData) => {
        setIsLoadingOpprettSak(true);
        const request = {
            ...lagBaseRequest(enhet, data.kategori, data.arbeidsfordeling),
            roller: [
                {
                    fodselsnummer: data.partISaken.ident,
                    type: data.partISaken.rolle === "bidragspliktig" ? Rolletype.BP : Rolletype.BM,
                    mottagerErVerge: false,
                    rolleType: data.partISaken.rolle === "bidragspliktig" ? Rolletype.BP : Rolletype.BM,
                },
                {
                    fodselsnummer: data.motpart.ident,
                    type: data.motpart.rolle === "bidragspliktig" ? Rolletype.BP : Rolletype.BM,
                    mottagerErVerge: false,
                    rolleType: data.motpart.rolle === "bidragspliktig" ? Rolletype.BP : Rolletype.BM,
                },
            ],
        } as OpprettSakRequest;

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
    };
}
