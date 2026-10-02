/* eslint-disable preserve-caught-error */

import {
    BIDRAG_DOKUMENT_API,
    BIDRAG_ORGANISASJON_API,
    BIDRAG_PERSON_API,
    BIDRAG_SAK_API,
    TilgangsFeilError,
} from "@bidrag/api";
import {
    DokumentFormatDto,
    type DokumentMetadata,
    type JournalpostDto,
    type JournalpostResponse,
} from "@bidrag/api/BidragDokumentApi";
import type { EnhetDto } from "@bidrag/api/OrganisasjonApi";
import type { ForelderBarnRelasjonDto, PersonDto, PersonRequest } from "@bidrag/api/PersonApi";
import type { BidragssakDto, FogdhistorikkDto, SakshendelseDto } from "@bidrag/api/SakApi";
import { LoggerService, SecureLoggerService } from "@bidrag/common";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

// ==================== SAK ====================

export function useHentSak(saksnummer: string | undefined, rollehistorikk: boolean = false, enabled: boolean = true) {
    return useQuery<BidragssakDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_sak", saksnummer, rollehistorikk],
        queryFn: async () => {
            try {
                const response = await BIDRAG_SAK_API.bidragSak.findMetadataForSak(saksnummer ?? "", {
                    "vis-rollehistorikk": rollehistorikk,
                });
                await LoggerService.debug("Hentet sak", { saksnummer });
                return response.data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til sak ${saksnummer}`);
                    throw new TilgangsFeilError("Du har ikke tilgang til denne saken");
                }

                if (status === 404) {
                    throw new Error(`Fant ikke sak med saksnummer ${saksnummer}`);
                }

                throw e;
            }
        },
        enabled: enabled && !!saksnummer,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

// ==================== SAMHANDLER ====================

// ==================== PERSON ====================

export function useHentPersoninformasjon(request: PersonRequest | null, enabled: boolean = true) {
    return useQuery<PersonDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_personinformasjon", request?.ident],
        queryFn: async () => {
            if (!request) throw new Error("Request is required");
            try {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost(request);
                await SecureLoggerService.info(`Hentet personinformasjon for ident ${request.ident}`);
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til person ${request.ident}`);
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til informasjon om denne personen ${request.ident}`,
                    );
                }
                throw e;
            }
        },
        enabled: enabled && !!request?.ident,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    });
}

export function useHentPersoninformasjonMutation() {
    return useMutation<PersonDto, AxiosError | TilgangsFeilError, PersonRequest>({
        mutationFn: async (request) => {
            try {
                const { data, status } = await BIDRAG_PERSON_API.informasjon.hentPersonPost(request);
                await SecureLoggerService.info(`Hentet personinformasjon for ident ${request.ident}`);
                if (status !== 200) {
                    throw new Error(`Fant ikke person med ident ${request.ident}`);
                }
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til person ${request.ident}`);
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til informasjon om denne personen ${request.ident}`,
                    );
                }
                throw e;
            }
        },
    });
}

export function useHentFlerePersoninformasjon(identer: string[], enabled: boolean = true) {
    return useQueries({
        queries: identer.map((ident) => ({
            queryKey: ["hent_personinformasjon", ident],
            queryFn: async () => {
                try {
                    const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                        ident,
                    });
                    await SecureLoggerService.info(`Hentet personinformasjon for ident ${ident}`);
                    return data;
                } catch (e) {
                    const axiosError = e as AxiosError;
                    const status = axiosError?.response?.status;

                    if (status === 403 || status === 401) {
                        await SecureLoggerService.warn(`Ingen tilgang til person ${ident}`);
                        throw new TilgangsFeilError(`Du har ikke tilgang til informasjon om denne personen ${ident}`);
                    }
                    throw e;
                }
            },
            enabled: enabled && ident.length === 11,
            retry: (failureCount: number, error: Error) => {
                if (error instanceof TilgangsFeilError) {
                    return false;
                }
                return failureCount < 1;
            },
            throwOnError: false,
        })),
    });
}

export function useHentForelderBarnRelasjon(request: PersonRequest | null, enabled: boolean = true) {
    return useQuery<ForelderBarnRelasjonDto | undefined, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_forelder_barn_relasjon", request?.ident],
        queryFn: async (): Promise<ForelderBarnRelasjonDto | undefined> => {
            if (!request || !enabled) return undefined;
            try {
                const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1(request);
                await SecureLoggerService.info(`Hentet forelder-barn relasjon for ident ${request.ident}`);
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til relasjoner for barn ${request.ident}`);
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til å hente relasjoner for denne personen ${request.ident}`,
                    );
                }
                throw e;
            }
        },
        enabled: enabled && !!request?.ident,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    });
}

// ==================== ORGANISASJON ====================

export function useHentEnhetInfomasjon(enhetnummer: string | null, enabled: boolean = true) {
    return useQuery<EnhetDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_enhet_info", enhetnummer],
        queryFn: async () => {
            if (!enhetnummer) throw new Error("Enhetnummer is required");
            try {
                const { data } = await BIDRAG_ORGANISASJON_API.enhet.hentEnhetInfo(enhetnummer);
                await SecureLoggerService.info(`Hentet enhetsinformasjon for enhet ${enhetnummer}`);
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til å hente enhetsinformasjon for enhet ${enhetnummer}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til å hente informasjon om denne enheten ${enhetnummer}`,
                    );
                }
                throw e;
            }
        },
        enabled: enabled && !!enhetnummer,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    });
}

// ==================== FOGDHISTORIKK ====================

export function useHentFogdhistorikk(saksnummer: string, enabled: boolean = true) {
    return useQuery<FogdhistorikkDto[], AxiosError | TilgangsFeilError>({
        queryKey: ["hent_fogdhistorikk", saksnummer],
        queryFn: async () => {
            try {
                const response = await BIDRAG_SAK_API.bidragSak.finnFogdhistorikk(saksnummer, {
                    validateStatus: (status) => {
                        return status === 200 || status === 404;
                    },
                });

                if (response.status === 404) {
                    await SecureLoggerService.info(`Ingen fogdhistorikk funnet for saksnummer ${saksnummer}`);
                    return [];
                }

                await SecureLoggerService.info(`Hentet fogdhistorikk for saksnummer ${saksnummer}`);
                return response.data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til fogdhistorikk for saksnummer ${saksnummer}`);
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til fogdhistorikk for dette saksnummeret (${saksnummer})`,
                    );
                }
                await SecureLoggerService.error(
                    `Kunne ikke hente fogdhistorikk for saksnummer ${saksnummer}`,
                    e instanceof Error ? e : new Error(String(e)),
                );
                throw e;
            }
        },
        enabled: enabled && !!saksnummer,
        retry: (failureCount, error) => {
            if ((error as AxiosError)?.response?.status === 404) {
                return false;
            }
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

// ==================== DOKUMENT ====================

/**
 * Journalposter for en sak. `bareFarskapUtelukket` er et enten/eller-filter i bidrag-dokument:
 * `false` (standard) gir alle journalposter *unntatt* de farskapsutelukkede, mens `true` gir
 * *kun* de farskapsutelukkede. De to utvalgene hentes derfor som hver sin query.
 */
function useHentJournalpostQuery(saksnummer: string, bareFarskapUtelukket: boolean, enabled: boolean) {
    const beskrivelse = bareFarskapUtelukket ? "farskapsutelukkede journalposter" : "journalposter";

    return useQuery<JournalpostDto[], AxiosError | TilgangsFeilError>({
        queryKey: ["hent_journalposter", saksnummer, { bareFarskapUtelukket }],
        queryFn: async () => {
            try {
                const response = await BIDRAG_DOKUMENT_API.sak.hentJournal(
                    saksnummer,
                    { fagomrade: ["BID", "FAR"], bareFarskapUtelukket },
                    {
                        validateStatus: (status) => {
                            return status === 200 || status === 404;
                        },
                    },
                );

                if (response.status === 404) {
                    await SecureLoggerService.info(`Ingen ${beskrivelse} funnet for saksnummer ${saksnummer}`);
                    return [];
                }

                await SecureLoggerService.info(`Hentet ${beskrivelse} for saksnummer ${saksnummer}`);
                return response.data;
            } catch (e) {
                return handleApiError(e, `hente ${beskrivelse} for saksnummer ${saksnummer}`);
            }
        },
        enabled: enabled && !!saksnummer,
        retry: (failureCount, error) => {
            if ((error as AxiosError)?.response?.status === 404) {
                return false;
            }
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export function useHentJournalposter(saksnummer: string, enabled: boolean = true) {
    return useHentJournalpostQuery(saksnummer, false, enabled);
}

/** Kun journalposter der farskap er utelukket – vises bare når brukeren velger det eksplisitt. */
export function useHentFarskapUtelukkedeJournalposter(saksnummer: string, enabled: boolean = true) {
    return useHentJournalpostQuery(saksnummer, true, enabled);
}

interface HentDokumentRequest {
    journalpostId: string;
    dokumentreferanse?: string;
    resizeToA4?: boolean;
    optimizeForPrint?: boolean;
}

interface HentDokumenterRequest {
    dokumenter: string[];
    resizeToA4?: boolean;
    optimizeForPrint?: boolean;
}

interface HentDokumentUrlRequest {
    journalpostId: string;
    dokumentreferanse: string;
}

export function useHentDokumentMetadata(journalpostId: string, dokumentreferanse?: string, enabled: boolean = true) {
    return useQuery<DokumentMetadata[], AxiosError | TilgangsFeilError>({
        queryKey: ["hent_dokument_metadata", journalpostId, dokumentreferanse],
        queryFn: async () => {
            try {
                const response = dokumentreferanse
                    ? await BIDRAG_DOKUMENT_API.dokument.hentDokumentMetadataGet1(journalpostId, dokumentreferanse, {
                          validateStatus: (status) => status === 200 || status === 204 || status === 404,
                      })
                    : await BIDRAG_DOKUMENT_API.dokument.hentDokumentMetadataGet(journalpostId, {
                          validateStatus: (status) => status === 200 || status === 204 || status === 404,
                      });

                if (response.status === 404 || response.status === 204) {
                    await SecureLoggerService.info(
                        `Ingen dokumentmetadata funnet for journalpost ${journalpostId} og dokumentreferanse ${dokumentreferanse ?? "N/A"}`,
                    );
                    return [];
                }

                return response.data;
            } catch (e) {
                return handleApiError(
                    e,
                    `hente dokumentmetadata for journalpost ${journalpostId} og dokumentreferanse ${dokumentreferanse ?? "N/A"}`,
                );
            }
        },
        enabled: enabled && !!journalpostId,
        retry: (failureCount, error) => {
            if ((error as AxiosError)?.response?.status === 404 || error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export async function hentDokumentApi({
    journalpostId,
    dokumentreferanse,
    resizeToA4,
    optimizeForPrint,
}: HentDokumentRequest): Promise<ArrayBuffer> {
    try {
        const queryParams = new URLSearchParams();
        queryParams.set("resizeToA4", String(Boolean(resizeToA4)));
        queryParams.set("optimizeForPrint", String(optimizeForPrint ?? true));
        const path = dokumentreferanse
            ? `/dokument/${journalpostId}/${dokumentreferanse}`
            : `/dokument/${journalpostId}`;
        const response = await BIDRAG_DOKUMENT_API.request<ArrayBuffer, unknown>({
            path: `${path}?${queryParams.toString()}`,
            method: "GET",
            secure: true,
            format: "arraybuffer",
        });

        return response.data;
    } catch (e) {
        return handleApiError(
            e,
            `hente dokument for journalpost ${journalpostId} og dokumentreferanse ${dokumentreferanse ?? "N/A"}`,
        );
    }
}

export async function hentDokumentUrlApi({
    journalpostId,
    dokumentreferanse,
}: HentDokumentUrlRequest): Promise<string> {
    try {
        const response = await BIDRAG_DOKUMENT_API.tilgang.giTilgangTilDokument(journalpostId, dokumentreferanse);
        return response.data.dokumentUrl;
    } catch (e) {
        return handleApiError(
            e,
            `hente dokument-URL for journalpost ${journalpostId} og referanse ${dokumentreferanse}`,
        );
    }
}

// ==================== REACT QUERY HOOKS ====================

export function useHentDokument() {
    return useMutation<ArrayBuffer, AxiosError | TilgangsFeilError, HentDokumentRequest>({
        mutationKey: ["hent_dokument"],
        mutationFn: hentDokumentApi,
    });
}

/**
 * Henter én sammenslått PDF for en liste med dokumenter. Hvert element må være på formatet
 * `<Kilde>-<journalpostId>:<dokumentReferanse>` (f.eks. `JOARK-123:456`), slik `hentDokumenter`-
 * endepunktet forventer.
 */
export async function hentDokumenterApi({
    dokumenter,
    resizeToA4,
    optimizeForPrint,
}: HentDokumenterRequest): Promise<ArrayBuffer> {
    try {
        const queryParams = new URLSearchParams();
        dokumenter.forEach((dokument) => {
            queryParams.append("dokument", dokument);
        });
        queryParams.set("resizeToA4", String(Boolean(resizeToA4)));
        queryParams.set("optimizeForPrint", String(optimizeForPrint ?? true));

        const response = await BIDRAG_DOKUMENT_API.request<ArrayBuffer, unknown>({
            path: `/dokument?${queryParams.toString()}`,
            method: "GET",
            secure: true,
            format: "arraybuffer",
        });

        return response.data;
    } catch (e) {
        return handleApiError(e, "hente dokumentene");
    }
}

// Her brukes HentDokumenterRequest akkurat som før!
export function useHentDokumenter() {
    return useMutation<ArrayBuffer, AxiosError | TilgangsFeilError, HentDokumenterRequest>({
        mutationKey: ["hent_dokumenter"],
        mutationFn: hentDokumenterApi,
    });
}

/**
 * Query-variant av `hentDokumenter` for visning av én sammenslått PDF drevet av URL-en (f.eks.
 * `?dokument=JOARK-123:456&dokument=JOARK-123:789`). Returnerer samme `{ type, payload }`-form som
 * `useHentSaksdokumentPdf`, slik at `PdfVisning` kan gjenbrukes direkte.
 */
export function useHentDokumenterPdf(dokumenter: string[], enabled: boolean = true) {
    return useQuery({
        queryKey: ["pdf-dokumenter", dokumenter],
        enabled: enabled && dokumenter.length > 0,
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const arrayBuffer = await hentDokumenterApi({ dokumenter });
            return { type: "RAW" as const, payload: arrayBuffer };
        },
    });
}

export function useHentDokumentUrl() {
    return useMutation<string, AxiosError | TilgangsFeilError, HentDokumentUrlRequest>({
        mutationKey: ["hent_dokument_url"],
        mutationFn: hentDokumentUrlApi,
    });
}

export function useHentSaksdokumentPdf(journalpostId?: string, dokumentreferanse?: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ["pdf-dokument", journalpostId, dokumentreferanse],
        enabled: enabled && !!journalpostId,
        staleTime: 1000 * 60 * 5,

        queryFn: async () => {
            if (!journalpostId) {
                throw new Error("Mangler journalpostId for å hente dokument");
            }

            // Formatet er ikke kjent på forhånd (f.eks. dokumenter under produksjon), så det må hentes her
            const metadataResponse = dokumentreferanse
                ? await BIDRAG_DOKUMENT_API.dokument.hentDokumentMetadataGet1(journalpostId, dokumentreferanse)
                : await BIDRAG_DOKUMENT_API.dokument.hentDokumentMetadataGet(journalpostId);
            const erMBDok = metadataResponse.data[0]?.format === DokumentFormatDto.MBDOK;

            if (erMBDok) {
                const url = await hentDokumentUrlApi({
                    journalpostId: journalpostId,
                    dokumentreferanse: dokumentreferanse ?? "",
                });
                return { type: "URL", payload: url };
            }

            const arrayBuffer = await hentDokumentApi({
                journalpostId: journalpostId,
                dokumentreferanse: dokumentreferanse,
            });

            return { type: "RAW", payload: arrayBuffer };
        },
    });
}

export function useFinnHendelserForSak(saksnummer: string, enabled: boolean = true) {
    return useQuery<SakshendelseDto[], AxiosError | TilgangsFeilError>({
        queryKey: ["finn_hendelser_for_sak", saksnummer],
        queryFn: async () => {
            try {
                const response = await BIDRAG_SAK_API.sak.finnHendelserForSak(saksnummer, {
                    validateStatus: (status) => status === 200 || status === 404,
                });

                if (response.status === 404) {
                    await SecureLoggerService.info(`Ingen hendelser funnet for saksnummer ${saksnummer}`);
                    return [];
                }

                await SecureLoggerService.info(`Hentet hendelser for saksnummer ${saksnummer}`);
                return response.data;
            } catch (e) {
                return handleApiError(e, `hente hendelser for saksnummer ${saksnummer}`);
            }
        },
        enabled: enabled && !!saksnummer,
        retry: (failureCount, error) => {
            if ((error as AxiosError)?.response?.status === 404 || error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export function useHentJournalpost(journalpostId: string, enabled: boolean = true) {
    return useQuery<JournalpostResponse, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_journalpost", journalpostId],
        queryFn: async () => {
            try {
                const response = await BIDRAG_DOKUMENT_API.journal.hentJournalpost(journalpostId);
                return response.data;
            } catch (error) {
                return handleApiError(error, `hente journalpost ${journalpostId}`);
            }
        },
        enabled: enabled && Boolean(journalpostId),
    });
}

export function useHarSkrivetilgang(saksnummer: string, enhet: string | null) {
    return useQuery<boolean, AxiosError | TilgangsFeilError>({
        queryKey: ["har_skrivetilgang", saksnummer, enhet],
        queryFn: async () => {
            try {
                const response = await BIDRAG_SAK_API.sak.harSkrivetilgang(saksnummer, { enhet: enhet ?? "" });
                return response.data;
            } catch (e) {
                return handleApiError(e, `sjekke skrivetilgang for saksnummer ${saksnummer} og enhet ${enhet}`);
            }
        },
        enabled: !!saksnummer && !!enhet,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

// ==================== HELPER ====================

async function handleApiError(e: unknown, handling: string): Promise<never> {
    const axiosError = e as AxiosError;
    const status = axiosError?.response?.status;

    if (status === 401) {
        await SecureLoggerService.warn(`Sesjon utløpt eller manglende autentisering ved å ${handling}`);
        throw new Error("Sesjonen din har utløpt. Vennligst last siden på nytt.");
    }

    if (status === 403) {
        await SecureLoggerService.warn(`Ingen tilgang til å ${handling}`);
        throw new TilgangsFeilError(`Du har ikke tilgang til å ${handling}`);
    }

    await SecureLoggerService.error(`Kunne ikke ${handling}`, axiosError);
    throw e;
}
