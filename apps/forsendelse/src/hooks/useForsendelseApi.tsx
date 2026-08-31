import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type {
    DokumentMalDetaljer,
    ForsendelseBarnIBehandlingDto,
    ForsendelseResponsTo,
    HentDokumentValgResponse,
} from "@bidrag/api/BidragForsendelseApi";
import type { BidragssakDto, RolleDto } from "@bidrag/api/SakApi";
import {
    IdentUtils,
    type IRolleDetaljer,
    ObjectUtils,
    type RolleType,
    RolleTypeAbbreviation,
    RolleTypeFullName,
    StringUtils,
} from "@bidrag/common";
import { useQueryClient, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse, HttpStatusCode } from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useBidragDokumentApi, useBidragForsendelseApi, usePersonApi, useSakApi } from "../api/api";
import { DokumentStatus } from "../constants/DokumentStatus";
import type { SAKSNUMMER } from "../constants/fellestyper";
import { useErrorContext } from "../context/ErrorProvider";
import { useSession } from "../pages/forsendelse/context/SessionContext";
import type { IForsendelse } from "../types/Forsendelse";
import type { IJournalpost } from "../types/Journalpost";
import { parseErrorMessageFromAxiosError } from "../utils/ErrorUtils";
import { journalpostMapper } from "./useDokumentApi";
import { useHentPerson, useHentSamhandlerEllerPersonForIdent } from "./usePersonApi";

export type VedleggListe = { malId: string; detaljer: DokumentMalDetaljer }[];
type IRollePersonInfo = {
    ident: string;
    visningsnavn: string;
    harTilgangTilPerson: boolean;
};

type ISakerForPersonResult = {
    saksnummere: string[];
    harTilgang: boolean;
};

type IJournalposterForPersonResult = {
    saksnummere: SAKSNUMMER[];
    journalposterForSak: Map<SAKSNUMMER, IJournalpost[]>;
    harTilgang: boolean;
    sakerUtenTilgang: Set<SAKSNUMMER>;
};

export const UseForsendelseApiKeys = {
    forsendelse: ["forsendelse"],
    sak: ["sak"],
    hentForsendelse: (forsendelseId: string) => [
        ...UseForsendelseApiKeys.forsendelse,
        forsendelseId?.replace(/\D/g, "").toString(),
    ],
    sakerPerson: (personId: string) => [...UseForsendelseApiKeys.sak, personId],
    dokumentValg: (behandlingType: string, soknadFra: string, soknadType: string) => [
        UseForsendelseApiKeys.forsendelse,
        "dokumentValg",
        behandlingType,
        soknadFra,
        soknadType,
    ],
};

const DOKUMENT_MAL_DETALJER_QUERY_KEY = "dokumentMalDetaljerV2";

function readBarnIBehandlingDetaljerFromCache(
    queryClient: ReturnType<typeof useQueryClient>,
    forsendelseId?: string,
): ForsendelseBarnIBehandlingDto[] {
    if (forsendelseId) {
        return (
            queryClient.getQueryData<HentDokumentValgResponse>([DOKUMENT_MAL_DETALJER_QUERY_KEY, forsendelseId])
                ?.barnIBehandlingDetaljer ?? []
        );
    }

    return (
        queryClient.getQueriesData<{ data: HentDokumentValgResponse }>({
            queryKey: [DOKUMENT_MAL_DETALJER_QUERY_KEY],
        })[0]?.[1]?.data?.barnIBehandlingDetaljer ?? []
    );
}

export function useBarnIBehandlingDetaljer(): ForsendelseBarnIBehandlingDto[] {
    const { forsendelseId } = useSession();
    const { behandlingInfo } = useHentForsendelseQuery();
    const queryClient = useQueryClient();

    const getBarnIBehandlingDetaljer = useCallback(() => {
        const forsendelseBarnIBehandlingDetaljer = behandlingInfo?.barnIBehandlingDetaljer;
        return forsendelseBarnIBehandlingDetaljer ?? readBarnIBehandlingDetaljerFromCache(queryClient, forsendelseId);
    }, [behandlingInfo?.barnIBehandlingDetaljer, queryClient, forsendelseId]);

    const [barnIBehandlingDetaljer, setBarnIBehandlingDetaljer] =
        useState<ForsendelseBarnIBehandlingDto[]>(getBarnIBehandlingDetaljer);

    useEffect(() => {
        setBarnIBehandlingDetaljer(getBarnIBehandlingDetaljer());

        return queryClient.getQueryCache().subscribe((event) => {
            if (event?.query?.queryKey?.[0] === DOKUMENT_MAL_DETALJER_QUERY_KEY) {
                setBarnIBehandlingDetaljer(getBarnIBehandlingDetaljer());
            }
        });
    }, [queryClient, getBarnIBehandlingDetaljer]);

    return barnIBehandlingDetaljer;
}

const isForbiddenError = (error: unknown): boolean => {
    return error instanceof AxiosError && error.response?.status === HttpStatusCode.Forbidden;
};

export const useHentSakerPerson = (ident: string): ISakerForPersonResult => {
    const sakApi = useSakApi();
    const { data: sakerPerson } = useSuspenseQuery({
        queryKey: UseForsendelseApiKeys.sakerPerson(ident),
        queryFn: async (): Promise<ISakerForPersonResult> => {
            if (!ident) return { saksnummere: [], harTilgang: true };

            try {
                const response = await sakApi.bidragSak.find(ident);
                return {
                    saksnummere: response.data.map((sak) => sak.saksnummer),
                    harTilgang: true,
                };
            } catch (error) {
                if (isForbiddenError(error)) {
                    return { saksnummere: [], harTilgang: false };
                }
                throw error;
            }
        },
    });

    return sakerPerson;
};

const selectMappedJournalposter = (response: AxiosResponse): IJournalpost[] => {
    const journalposter = response.data as JournalpostDto[];
    return journalposter.map((journalpost) => journalpostMapper(journalpost));
};

export const useHentJournalposterForSak = (saksnummer: string): IJournalpost[] => {
    // console.log("Henter journalposter for sak", saksnummer);
    const bidragDokumentApi = useBidragDokumentApi();
    const { data: journalposter } = useSuspenseQuery({
        queryKey: [`journal_sak_${saksnummer}`],
        queryFn: async () => {
            try {
                return await bidragDokumentApi.sak.hentJournal(
                    saksnummer,
                    { fagomrade: ["BID", "FAR"] },
                    {
                        paramsSerializer: {
                            indexes: null,
                        },
                    },
                );
            } catch {
                return { data: [] } as AxiosResponse;
            }
        },
        select: selectMappedJournalposter,
    });

    return journalposter;
};

export const useHentJournalposterForPerson = (ident?: string): IJournalposterForPersonResult => {
    const { saksnummere: saker, harTilgang } = useHentSakerPerson(ident);
    const bidragDokumentApi = useBidragDokumentApi();
    const journalposterQueries = useSuspenseQueries({
        queries: saker.map((saksnummer) => ({
            queryKey: ["journalposter", saksnummer],
            queryFn: async (): Promise<{ journalposter: IJournalpost[]; harTilgang: boolean }> => {
                try {
                    const response = await bidragDokumentApi.sak.hentJournal(
                        saksnummer,
                        { fagomrade: ["BID", "FAR"] },
                        {
                            paramsSerializer: {
                                indexes: null,
                            },
                        },
                    );
                    return {
                        journalposter: selectMappedJournalposter(response),
                        harTilgang: true,
                    };
                } catch (error) {
                    if (isForbiddenError(error)) {
                        return {
                            journalposter: [],
                            harTilgang: false,
                        };
                    }
                    console.log("Error", error);
                    return {
                        journalposter: [],
                        harTilgang: true,
                    };
                }
            },
            staleTime: Infinity,
        })),
    });

    const journalpostSakMap = new Map<string, IJournalpost[]>();
    const sakerUtenTilgang = new Set<SAKSNUMMER>();
    saker.forEach((saksnummer, idx) => {
        journalpostSakMap.set(saksnummer, journalposterQueries[idx].data.journalposter);
        if (!journalposterQueries[idx].data.harTilgang) {
            sakerUtenTilgang.add(saksnummer);
        }
    });

    return {
        saksnummere: saker,
        journalposterForSak: journalpostSakMap,
        harTilgang,
        sakerUtenTilgang,
    };
};

const useHentSak = (): BidragssakDto => {
    const { saksnummer: saksnummerFromSession } = useSession();
    const { saksnummer: saksnummerFromForsendelse } = useHentForsendelseQuery();
    const sakApi = useSakApi();
    const saksnummer = saksnummerFromSession ?? saksnummerFromForsendelse;

    const { data: sak } = useSuspenseQuery({
        queryKey: [`sak_${saksnummer}`],
        queryFn: () => sakApi.bidragSak.findMetadataForSak(saksnummer),
    });

    return sak.data;
};

export const useHentRoller = () => {
    const sak = useHentSak();
    const idents = sak.roller.map(
        (rolle) => rolle.fodselsnummer ?? (rolle as RolleDto & { samhandlerIdent?: string }).samhandlerIdent,
    );
    const personApi = usePersonApi();

    const personQueries = useSuspenseQueries({
        queries: idents.map((ident) => ({
            queryKey: ["person", ident],
            queryFn: async (): Promise<IRollePersonInfo> => {
                if (!ident || StringUtils.isEmpty(ident)) {
                    return { ident: "", visningsnavn: "Ukjent", harTilgangTilPerson: true };
                }

                try {
                    const { data } = await personApi.informasjon.hentPersonPost({ ident });
                    return {
                        ...data,
                        harTilgangTilPerson: true,
                    };
                } catch (error) {
                    if (isForbiddenError(error)) {
                        return {
                            ident,
                            visningsnavn: "",
                            harTilgangTilPerson: false,
                        };
                    }
                    throw error;
                }
            },
        })),
    });

    return sak.roller.map((rolle, index) => ({
        rolleType: RolleTypeAbbreviation[rolle.rolleType] ?? RolleTypeFullName[rolle.rolleType],
        ident: rolle.fodselsnummer ?? (rolle as RolleDto & { samhandlerIdent?: string }).samhandlerIdent,
        objektnummer: rolle.objektnummer,
        navn: personQueries[index]?.data?.visningsnavn,
        harTilgangTilPerson: personQueries[index]?.data?.harTilgangTilPerson ?? true,
    }));
};

const useRolleISak = (ident: string): RolleType | null => {
    const sak = useHentSak();
    return (
        RolleTypeAbbreviation[sak.roller?.find((r) => r.fodselsnummer === ident)?.rolleType] ||
        RolleTypeFullName[sak.roller?.find((r) => r.fodselsnummer === ident)?.rolleType]
    );
};

export const useHentGjelder = (): IRolleDetaljer => {
    const forsendelse = useHentForsendelseQuery();
    const gjelderIdent = forsendelse.gjelderIdent;
    const person = useHentPerson(gjelderIdent);

    const ident = gjelderIdent;
    const navn = person.visningsnavn;
    return {
        rolleType: useRolleISak(ident),
        navn,
        ident,
    };
};

export const useHentMottaker = (): IRolleDetaljer => {
    const forsendelse = useHentForsendelseQuery();
    const mottaker = forsendelse.mottaker;
    const defaultRolle = {} as IRolleDetaljer;
    const { data: samhandlerEllerPerson } = useHentSamhandlerEllerPersonForIdent(mottaker?.ident ?? "");
    const rolleType = useRolleISak(mottaker?.ident ?? "");

    if (!mottaker) return defaultRolle;

    const resolvedMottaker =
        !mottaker.navn || IdentUtils.isSamhandlerId(mottaker.ident) ? (samhandlerEllerPerson ?? mottaker) : mottaker;

    return {
        rolleType,
        navn: resolvedMottaker.navn,
        ident: resolvedMottaker.ident,
    };
};

export const useVedleggListe = () => {
    const { enhet } = useSession();
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useSuspenseQuery({
        queryKey: [`vedlegg_liste`, enhet],
        queryFn: () => bidragForsendelseApi.api.stottedeDokumentmalDetaljer(),
        select: React.useCallback(
            (response: AxiosResponse): VedleggListe => {
                const dokumentmaler = response.data as Record<string, DokumentMalDetaljer>;
                return Object.entries(dokumentmaler)
                    .filter(
                        ([_, value]) =>
                            value.statiskInnhold &&
                            (value.tilhorerEnheter.length === 0 || value.tilhorerEnheter.includes(enhet)),
                    )
                    .map(([key, value]) => ({
                        malId: key,
                        detaljer: value,
                    }));
            },
            [enhet],
        ),
    });
};

export const useHentStørrelseIMb = () => {
    const { forsendelseId } = useSession();
    const bidragForsendelseApi = useBidragForsendelseApi();
    const result = useSuspenseQuery({
        queryKey: ["forsendelse_størrelse", forsendelseId],
        queryFn: () => bidragForsendelseApi.api.henStorrelsePaDokumenter(forsendelseId),
        select: (data) => data.data,
    });
    return result.data;
};
export const useHentRevurderingsbarn = (ident: string): boolean => {
    const barnIBehandlingDetaljer = useBarnIBehandlingDetaljer();
    return barnIBehandlingDetaljer.find((barn) => barn.ident === ident)?.erRevurderingsbarn ?? false;
};
export function useHentForsendelseQuery(): IForsendelse {
    const { forsendelseId, saksnummer: saksnummerFromSession } = useSession();
    const { addError } = useErrorContext();
    const bidragForsendelseApi = useBidragForsendelseApi();
    const { data: forsendelse, isRefetching } = useSuspenseQuery({
        queryKey: UseForsendelseApiKeys.hentForsendelse(forsendelseId),
        queryFn: async () => {
            if (!forsendelseId) return {} as IForsendelse;
            try {
                const response = await bidragForsendelseApi.api.hentForsendelse(forsendelseId, {
                    saksnummer: saksnummerFromSession,
                });
                const forsendelse = response.data as ForsendelseResponsTo;
                const forsendelseInternal: IForsendelse = {
                    ...forsendelse,
                    forsendelseId,
                    dokumenter: forsendelse.dokumenter.map((dokument, index) => {
                        return {
                            ...dokument,
                            status: DokumentStatus[dokument.status],
                            fraSaksnummer: forsendelse.saksnummer,
                            lagret: true,
                            index,
                            metadata: null,
                        };
                    }),
                };

                return forsendelseInternal;
            } catch (error) {
                const errorMessage = parseErrorMessageFromAxiosError(error);
                addError({
                    message: `Kunne ikke hente forsendelse: ${errorMessage}`,
                    source: "hentforsendelse",
                });
            }
        },
        retry: (retryCount, error: AxiosError) => {
            return error?.response?.status === HttpStatusCode.NotFound ? retryCount < 1 : retryCount < 3;
        },
        refetchOnWindowFocus: (query) => {
            const state = query.state;
            return state?.error?.response?.status !== HttpStatusCode.NotFound;
        },
        refetchInterval: (result) => {
            const data = result.state?.data;
            if (ObjectUtils.isEmpty(data)) return 0;
            const forsendelse = data as IForsendelse;
            const hasDokumentsWithStatus = forsendelse.dokumenter.some((d) =>
                [
                    "IKKE_BESTILT",
                    "UNDER_PRODUKSJON",
                    "BESTILLING_FEILET",
                    "UNDER_PRODUKSJON",
                    "UNDER_REDIGERING",
                    "MÅ_KONTROLLERES",
                ].includes(d.status),
            );
            return hasDokumentsWithStatus ? 3000 : 0;
        },
    });

    return {
        ...forsendelse,
        isStaleData: isRefetching,
    };
}
