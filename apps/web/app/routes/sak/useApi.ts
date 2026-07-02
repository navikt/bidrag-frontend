/* eslint-disable preserve-caught-error */

import {
    BIDRAG_ORGANISASJON_API,
    BIDRAG_PERSON_API,
    BIDRAG_SAK_API,
    BIDRAG_SAMHANDLER_API,
    BIDRAG_TILGANGSKONTROLL_API,
    TilgangsFeilError,
} from "@bidrag/api";
import type { EnhetDto, HentEnhetRequest } from "@bidrag/api/OrganisasjonApi";
import type {
    ForelderBarnRelasjonDto,
    MotpartBarnRelasjonDto,
    PersonDto,
    PersonRequest,
} from "@bidrag/api/PersonApi";
import type {
    BidragssakDto,
    FogdhistorikkDto,
    OppdaterRollerISakRequest,
    OppdaterSakResponse,
    OpprettSakRequest,
} from "@bidrag/api/SakApi";
import type { SamhandlerDto } from "@bidrag/api/SamhandlerApi";
import {
    IdentUtils,
    ObjectUtils,
    SecureLoggerService,
    StringUtils,
} from "@bidrag/common";
import {
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
    useSuspenseQueries,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import type { ISamhandlerPersonInfo } from "./types/person";

// ==================== SAK ====================

export const QueryKeys = {
    kanOppretteSak: ["tilgang_sak_uten_bm"],
    hentSak: (saksnummer: string) => ["hent_sak", saksnummer],
    hentPersoninfo: (ident: string) => ["hent_personinfo", ident],
};
export const useHentPersonData = (ident?: string) => {
    return useQuery({
        queryKey: QueryKeys.hentPersoninfo(ident ?? ""),
        queryFn: async (): Promise<PersonDto> => {
            if (!ident || StringUtils.isEmpty(ident))
                return { ident: "", visningsnavn: "Ukjent" };
            const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost(
                { ident: ident },
            );
            return data;
        },
        enabled: !!ident && !StringUtils.isEmpty(ident),
        staleTime: Infinity,
        throwOnError: false,
    });
};
export function useKanOppretteSakUtenBm() {
    return useSuspenseQuery({
        queryKey: QueryKeys.kanOppretteSak,
        queryFn: async () => {
            try {
                const response =
                    await BIDRAG_TILGANGSKONTROLL_API.v2.sjekkTilgangOpprettSakUtenBm();
                return { data: response.data.harTilgang };
            } catch (e) {
                SecureLoggerService.error(
                    "Kunne ikke hente informasjon om saksbehandler kan opprette sak uten BM",
                    e,
                );
                return { data: false };
            }
        },
        select: (data) => data.data,
        initialData:
            process.env.NODE_ENV == "TEST"
                ? () => ({
                      data: false,
                  })
                : undefined,
    });
}

export function useSjekkTilgangOpprettSakUtenBm(enabled: boolean = true) {
    return useQuery<boolean, never>({
        queryKey: ["sjekk_tilgang_opprett_sak_uten_bm"],
        queryFn: async () => {
            try {
                const response =
                    await BIDRAG_TILGANGSKONTROLL_API.v2.sjekkTilgangOpprettSakUtenBm();

                await SecureLoggerService.info(
                    `Tilgangssjekk for opprettelse av sak uten BM: ${response.data ? "Har tilgang" : "Ingen tilgang"}`,
                );

                return response.data.harTilgang;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.info(
                        "Saksbehandleren mangler tilgang til å opprette sak uten BM",
                    );
                } else {
                    await SecureLoggerService.warn(
                        "Feil ved tilgangssjekk sak uten BM - antar ingen tilgang",
                        e,
                    );
                }

                return false;
            }
        },
        enabled: enabled,
        retry: false,
        staleTime: 5 * 60 * 1000,
        throwOnError: false,
    });
}

export function useOpprettSak() {
    return useMutation<
        string,
        AxiosError<string> | TilgangsFeilError,
        OpprettSakRequest
    >({
        mutationKey: ["opprett_sak"],
        mutationFn: async (request: OpprettSakRequest) => {
            try {
                const response = await BIDRAG_SAK_API.sak.opprettSak(request);
                const saksnummer = response.data.saksnummer;
                await SecureLoggerService.info(
                    `Opprettet ny sak med id ${saksnummer} for request ${JSON.stringify(request)}`,
                );
                return saksnummer;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til opprettelse av sak`,
                    );
                    throw new TilgangsFeilError(
                        "Du har ikke tilgang til opprettelse av sak",
                    );
                }
                if (e instanceof AxiosError) {
                    throw new Error(
                        e.response?.headers["warning"] ||
                            "Feil ved opprettelse av sak",
                    );
                }
                await SecureLoggerService.error(
                    `Kunne ikke opprette sak for request ${JSON.stringify(request)}`,
                    e,
                );
                throw e;
            }
        },
    });
}

export function useHentSakForPerson(ident: string, enabled: boolean = true) {
    return useQuery<BidragssakDto[], AxiosError | TilgangsFeilError>({
        queryKey: ["hent_sak_person", ident],
        queryFn: async () => {
            try {
                const response =
                    await BIDRAG_SAK_API.person.finnForFodselsnummer(
                        JSON.stringify(ident),
                        {
                            validateStatus: (status) => {
                                return status === 200 || status === 404;
                            },
                        },
                    );

                // Hvis 404, returner tom array
                if (response.status === 404) {
                    await SecureLoggerService.info(
                        `Ingen saker funnet for person ${ident}`,
                    );
                    return [];
                }

                await SecureLoggerService.info(
                    `Hentet sak for person ${ident}`,
                );
                return response.data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til saker for person ${ident}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til sakene for denne personen (${ident})`,
                    );
                }
                await SecureLoggerService.error(
                    `Kunne ikke hente sak for person ${ident}`,
                    e,
                );
                throw e;
            }
        },
        enabled: enabled && !!ident,
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

export function useHentSak(
    saksnummer: string,
    rollehistorikk: boolean = false,
) {
    return useQuery<BidragssakDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_sak", saksnummer, rollehistorikk],
        queryFn: async () => {
            try {
                const response =
                    await BIDRAG_SAK_API.bidragSak.findMetadataForSak(
                        saksnummer,
                        {
                            "vis-rollehistorikk": rollehistorikk,
                        },
                    );
                await SecureLoggerService.info(`Hentet sak ${saksnummer}`);
                return response.data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til sak ${saksnummer}`,
                    );
                    throw new TilgangsFeilError(
                        "Du har ikke tilgang til denne saken",
                    );
                }

                if (status === 404) {
                    throw new Error(
                        `Fant ikke sak med saksnummer ${saksnummer}`,
                    );
                }

                throw e;
            }
        },
        enabled: !!saksnummer,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export function useHentSakSuspense(saksnummer: string) {
    return useSuspenseQuery<BidragssakDto, AxiosError | TilgangsFeilError>({
        queryKey: QueryKeys.hentSak(saksnummer),
        queryFn: async () => {
            try {
                const response =
                    await BIDRAG_SAK_API.bidragSak.findMetadataForSak(
                        saksnummer,
                        {
                            "vis-rollehistorikk": true,
                        },
                    );
                await SecureLoggerService.info(`Hentet sak ${saksnummer}`);
                return response.data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til sak ${saksnummer}`,
                    );
                    throw new TilgangsFeilError(
                        "Du har ikke tilgang til denne saken",
                    );
                }

                if (status === 404) {
                    throw new Error(
                        `Fant ikke sak med saksnummer ${saksnummer}`,
                    );
                }

                throw e;
            }
        },
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export function useOppdaterSaksroller() {
    const queryClient = useQueryClient();
    return useMutation<
        OppdaterSakResponse,
        AxiosError | TilgangsFeilError,
        OppdaterRollerISakRequest
    >({
        mutationKey: ["oppdater_saksroller"],
        mutationFn: async (request: OppdaterRollerISakRequest) => {
            try {
                const response =
                    await BIDRAG_SAK_API.sak.oppdaterSakRoller(request);
                const sak = response.data;
                await SecureLoggerService.info(
                    `Oppdaterte sak ${request.saksnummer} med request ${JSON.stringify(request)}`,
                );
                return sak;
            } catch (error) {
                const axiosError = error as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til oppdatering av sak ${request.saksnummer}`,
                    );
                    throw new TilgangsFeilError(
                        "Du har ikke tilgang til oppdatering av denne saken",
                    );
                }
                throw error;
            }
        },
    });
}

// ==================== SAMHANDLER ====================

export function useHentSamhandler(ident: string, enabled: boolean = true) {
    return useQuery<SamhandlerDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_samhandler", ident],
        queryFn: async () => {
            try {
                if (!IdentUtils.isSamhandlerId(ident)) {
                    return { samhandlerId: ident } as SamhandlerDto;
                }
                const { data } =
                    await BIDRAG_SAMHANDLER_API.samhandler.hentSamhandler(
                        JSON.stringify(ident),
                    );
                await SecureLoggerService.info(
                    `Hentet samhandler for ident ${ident}`,
                );
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til samhandler ${ident}`,
                    );
                    throw new TilgangsFeilError(
                        "Du har ikke tilgang til denne samhandleren",
                    );
                }
                throw e;
            }
        },
        enabled: enabled && !!ident,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    });
}
export const useHentSamhandlerEllerPersonForIdent = (
    sjekkSamhandler: boolean = true,
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ident,
        }: {
            ident: string;
        }): Promise<ISamhandlerPersonInfo> => {
            if (ObjectUtils.isEmpty(ident))
                return { ident, visningsnavn: "", isValid: false };

            const queryKey = ["hent_samhandler_eller_person", ident];

            // Check cache first
            const cachedData =
                queryClient.getQueryData<ISamhandlerPersonInfo>(queryKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from API
            let result: PersonDto | ISamhandlerPersonInfo;

            try {
                if (IdentUtils.isSamhandlerId(ident) && sjekkSamhandler) {
                    const response =
                        await BIDRAG_SAMHANDLER_API.samhandler.hentSamhandler(
                            JSON.stringify(ident),
                        );
                    if (response.status !== 200)
                        throw Error(`Fant ikke samhandler med ident ${ident}`);
                    result = {
                        ident: response.data.samhandlerId,
                        navn: response.data.navn,
                        visningsnavn: response.data.navn,
                        offentligId: response.data.offentligId,
                        isValid: true,
                    };
                } else if (IdentUtils.isFnr(ident)) {
                    const response =
                        await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                            ident,
                        });

                    if (response.status !== 200)
                        throw Error(`Fant ikke person med ident ${ident}`);
                    result = {
                        ...response.data,
                        navn: response.data.visningsnavn,
                        visningsnavn: response.data.visningsnavn,
                        ident: response.data.ident,
                        offentligId: response.data.aktørId,
                        isValid: true,
                    };
                } else {
                    result = { ident, visningsnavn: "", isValid: false };
                }
            } catch (e) {
                await SecureLoggerService.warn(
                    `Feil ved henting av samhandler eller person for ident ${ident} - antar ugyldig ident`,
                    e,
                );
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til person ${ident}`,
                    );
                    throw new Error(`Du har ikke tilgang til informasjon om denne personen ${ident}. Dette kan skyldes diskresjonskode eller
                    manglende rettigheter.`);
                }
                throw e;
            }
            // Save to cache
            queryClient.setQueryData(queryKey, result);

            return result;
        },
        throwOnError: false,
        retry: 2,
    });
};

// ==================== PERSON ====================

export function useHentPersoninformasjon(
    request: PersonRequest | null,
    enabled: boolean = true,
) {
    return useQuery<PersonDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_personinformasjon", request?.ident],
        queryFn: async () => {
            if (!request) throw new Error("Request is required");
            try {
                const { data } =
                    await BIDRAG_PERSON_API.informasjon.hentPersonPost(request);
                await SecureLoggerService.info(
                    `Hentet personinformasjon for ident ${request.ident}`,
                );
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til person ${request.ident}`,
                    );
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
    return useMutation<
        PersonDto,
        AxiosError | TilgangsFeilError,
        PersonRequest
    >({
        mutationFn: async (request) => {
            try {
                const { data, status } =
                    await BIDRAG_PERSON_API.informasjon.hentPersonPost(request);
                await SecureLoggerService.info(
                    `Hentet personinformasjon for ident ${request.ident}`,
                );
                if (status !== 200) {
                    throw new Error(
                        `Fant ikke person med ident ${request.ident}`,
                    );
                }
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til person ${request.ident}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til informasjon om denne personen ${request.ident}`,
                    );
                }
                throw e;
            }
        },
    });
}

export function useHentFlerePersoninformasjonSuspense(
    identer: string[],
    enabled: boolean = true,
) {
    return useSuspenseQueries({
        queries: identer.map((ident) => ({
            queryKey: ["hent_personinformasjon", ident],
            queryFn: async () => {
                try {
                    const { data } =
                        await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                            ident,
                        });
                    await SecureLoggerService.info(
                        `Hentet personinformasjon for ident ${ident}`,
                    );
                    return data;
                } catch (e) {
                    const axiosError = e as AxiosError;
                    const status = axiosError?.response?.status;

                    if (status === 403 || status === 401) {
                        await SecureLoggerService.warn(
                            `Ingen tilgang til person ${ident}`,
                        );
                        throw new TilgangsFeilError(
                            `Du har ikke tilgang til informasjon om denne personen ${ident}`,
                        );
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
            throwOnError: true, // Enable throwing for suspense
        })),
    });
}

export function useHentFlerePersoninformasjon(
    identer: string[],
    enabled: boolean = true,
) {
    return useQueries({
        queries: identer.map((ident) => ({
            queryKey: ["hent_personinformasjon", ident],
            queryFn: async () => {
                try {
                    const { data } =
                        await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                            ident,
                        });
                    await SecureLoggerService.info(
                        `Hentet personinformasjon for ident ${ident}`,
                    );
                    return data;
                } catch (e) {
                    const axiosError = e as AxiosError;
                    const status = axiosError?.response?.status;

                    if (status === 403 || status === 401) {
                        await SecureLoggerService.warn(
                            `Ingen tilgang til person ${ident}`,
                        );
                        throw new TilgangsFeilError(
                            `Du har ikke tilgang til informasjon om denne personen ${ident}`,
                        );
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

function hentPersonMotpartBarnRelasjonQueryOptions(
    request: PersonRequest | null,
    enabled?: boolean,
) {
    return {
        queryKey: [
            "hent_person_motpart_barn_relasjon",
            request?.ident,
            enabled,
        ],
        queryFn: async (): Promise<MotpartBarnRelasjonDto | undefined> => {
            if (!request || enabled === false) return null;
            try {
                const { data } =
                    await BIDRAG_PERSON_API.motpartbarnrelasjon.getPersonensMotpartBarnRelasjon(
                        request,
                    );
                await SecureLoggerService.info(
                    `Hentet personen motpart-barn relasjon for ident ${request.ident}`,
                );
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til relasjoner for person ${request.ident}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til å hente relasjoner for denne personen ${request.ident}`,
                    );
                }
                throw e;
            }
        },
        retry: (failureCount: number, error: Error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    };
}

export function useHentPersonMotpartBarnRelasjon(
    request: PersonRequest | null,
    enabled: boolean = true,
) {
    return useQuery<MotpartBarnRelasjonDto, AxiosError | TilgangsFeilError>({
        ...hentPersonMotpartBarnRelasjonQueryOptions(request),
        enabled: enabled && !!request?.ident,
    });
}

export function useHentPersonMotpartBarnRelasjonSuspense(
    request: PersonRequest | null,
    enabled: boolean = true,
) {
    return useSuspenseQuery<
        MotpartBarnRelasjonDto,
        AxiosError | TilgangsFeilError
    >({
        ...hentPersonMotpartBarnRelasjonQueryOptions(request, enabled),
    });
}

export function useHentForelderBarnRelasjon(
    request: PersonRequest | null,
    enabled: boolean = true,
) {
    return useQuery<ForelderBarnRelasjonDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_forelder_barn_relasjon", request?.ident],
        queryFn: async (): Promise<ForelderBarnRelasjonDto | undefined> => {
            if (!request || enabled === false) return null;
            try {
                const { data } =
                    await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1(
                        request,
                    );
                await SecureLoggerService.info(
                    `Hentet forelder-barn relasjon for ident ${request.ident}`,
                );
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til relasjoner for barn ${request.ident}`,
                    );
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

function hentForeldreinformasjonForBarnQueryOptions(
    request: PersonRequest | null,
    enabled?: boolean,
) {
    return {
        queryKey: [
            "hent_foreldreinformasjon_for_barn",
            request?.ident,
            enabled,
        ],
        queryFn: async () => {
            if (!request?.ident || enabled === false) return null;

            try {
                const { data } =
                    await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1(
                        request,
                    );

                const foreldreIdenter = data.forelderBarnRelasjon
                    .filter((relasjon) => relasjon.minRolleForPerson === "BARN")
                    .map((relasjon) => relasjon.relatertPersonsIdent);

                if (foreldreIdenter.length === 0) {
                    return [];
                }

                SecureLoggerService.info(
                    `Hentet foreldre for barn med ident ${request.ident}. Antall foreldre: ${foreldreIdenter.length}`,
                ).catch(console.error);

                const foreldreResponses = await Promise.all(
                    foreldreIdenter.map((ident) =>
                        BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident }),
                    ),
                );

                return foreldreResponses.map((response) => response.data);
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til foreldreinfo for barn ${request.ident}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til foreldreinfo for denne personen ${request.ident}`,
                    );
                }
                throw e;
            }
        },
        retry: (failureCount: number, error: Error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    };
}

export function useHentForeldreinformasjonForBarn(
    request: PersonRequest | null,
    enabled: boolean = true,
) {
    return useQuery<PersonDto[], AxiosError | TilgangsFeilError>({
        ...hentForeldreinformasjonForBarnQueryOptions(request),
        enabled: enabled && !!request?.ident,
    });
}

export function useHentForeldreinformasjonForBarnSuspense(
    request: PersonRequest | null,
    enabled: boolean = true,
) {
    return useSuspenseQuery<PersonDto[], AxiosError | TilgangsFeilError>({
        ...hentForeldreinformasjonForBarnQueryOptions(request, enabled),
    });
}

// ==================== ORGANISASJON ====================

export function hentPersonGeografiskEnhetQueryOptions(
    request: HentEnhetRequest | null,
    enabled: boolean = true,
) {
    return {
        queryKey: ["hent_person_geografisk_enhet", request?.ident],
        queryFn: async () => {
            if (!request) throw new Error("Request is required");
            try {
                const { data } =
                    await BIDRAG_ORGANISASJON_API.arbeidsfordeling.hentArbeidsfordelingGeografiskTilknytningEnhet(
                        request,
                    );
                await SecureLoggerService.info(
                    `Hentet enheter fra arbeidsfordeling basert på geografisk tilknytning for ident ${request.ident}`,
                );
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til å hente enheter for ident ${request.ident}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til å hente enheter for denne personen ${request.ident}`,
                    );
                }
                throw e;
            }
        },
        enabled: enabled && !!request?.ident,
        retry: (failureCount: number, error: Error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    };
}

export function useHentPersonGeografiskEnhet(
    request: HentEnhetRequest | null,
    enabled: boolean = true,
) {
    return useQuery<EnhetDto, AxiosError | TilgangsFeilError>(
        hentPersonGeografiskEnhetQueryOptions(request, enabled),
    );
}

export function useHentEnhetInfomasjon(
    enhetnummer: string | null,
    enabled: boolean = true,
) {
    return useQuery<EnhetDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_enhet_info", enhetnummer],
        queryFn: async () => {
            if (!enhetnummer) throw new Error("Enhetnummer is required");
            try {
                const { data } =
                    await BIDRAG_ORGANISASJON_API.enhet.hentEnhetInfo(
                        enhetnummer,
                    );
                await SecureLoggerService.info(
                    `Hentet enhetsinformasjon for enhet ${enhetnummer}`,
                );
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

export function useHentFogdhistorikk(
    saksnummer: string,
    enabled: boolean = true,
) {
    return useQuery<FogdhistorikkDto[], AxiosError | TilgangsFeilError>({
        queryKey: ["hent_fogdhistorikk", saksnummer],
        queryFn: async () => {
            try {
                console.log("Hent fogdhistorikk", saksnummer);
                const response =
                    await BIDRAG_SAK_API.bidragSak.finnFogdhistorikk(
                        saksnummer,
                        {
                            validateStatus: (status) => {
                                return status === 200 || status === 404;
                            },
                        },
                    );

                // Hvis 404, returner tom array
                if (response.status === 404) {
                    await SecureLoggerService.info(
                        `Ingen fogdhistorikk funnet for saksnummer ${saksnummer}`,
                    );
                    return [];
                }

                await SecureLoggerService.info(
                    `Hentet fogdhistorikk for saksnummer ${saksnummer}`,
                );
                return response.data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til fogdhistorikk for saksnummer ${saksnummer}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til fogdhistorikk for dette saksnummeret (${saksnummer})`,
                    );
                }
                await SecureLoggerService.error(
                    `Kunne ikke hente fogdhistorikk for saksnummer ${saksnummer}`,
                    e,
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
