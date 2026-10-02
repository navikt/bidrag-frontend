import { BIDRAG_PERSON_API, BIDRAG_SAK_API, BIDRAG_TILGANGSKONTROLL_API, TilgangsFeilError } from "@bidrag/api";
import type { ForelderBarnRelasjonDto, MotpartBarnRelasjonDto, PersonRequest } from "@bidrag/api/PersonApi";
import type { OpprettSakRequest } from "@bidrag/api/SakApi";
import { useMutation, useQueries, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { SecureLoggerService } from "../logging";

/**
 * Datahentings-hooker for "Opprett ny sak"-funksjonaliteten (delt mellom
 * apps/web sin egen rute og apps/behandling sin innebygde modal). Speiler
 * mønsteret i apps/web/app/api/useApi.ts (samme retry-/TilgangsFeilError-
 * konvensjon), men bor her i @bidrag/common siden apps/behandling ikke kan
 * importere fra apps/web.
 */
export function useKanOppretteSakUtenBm() {
    return useSuspenseQuery({
        queryKey: ["kan_opprette_sak_uten_bm"],
        queryFn: async () => {
            try {
                const response = await BIDRAG_TILGANGSKONTROLL_API.v2.sjekkTilgangOpprettSakUtenBm();
                return { data: response.data.harTilgang };
            } catch (e) {
                await SecureLoggerService.error(
                    "Kunne ikke hente informasjon om saksbehandler kan opprette sak uten BM",
                    e instanceof Error ? e : new Error(String(e)),
                );
                return { data: false };
            }
        },
        select: (data) => data.data,
    });
}

export function useOpprettSak() {
    return useMutation<string, AxiosError<string> | TilgangsFeilError, OpprettSakRequest>({
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
                    await SecureLoggerService.warn(`Ingen tilgang til opprettelse av sak`);
                    throw new TilgangsFeilError("Du har ikke tilgang til opprettelse av sak");
                }
                if (axiosError.isAxiosError) {
                    throw new Error(axiosError.response?.headers.warning || "Feil ved opprettelse av sak");
                }
                await SecureLoggerService.error(
                    `Kunne ikke opprette sak for request ${JSON.stringify(request)}`,
                    e instanceof Error ? e : new Error(String(e)),
                );
                throw e;
            }
        },
    });
}

function hentPersonMotpartBarnRelasjonQueryOptions(request: PersonRequest | null, enabled?: boolean) {
    return {
        queryKey: ["hent_person_motpart_barn_relasjon", request?.ident, enabled],
        queryFn: async (): Promise<MotpartBarnRelasjonDto | undefined> => {
            if (!request || enabled === false) return undefined;
            try {
                const { data } = await BIDRAG_PERSON_API.motpartbarnrelasjon.getPersonensMotpartBarnRelasjon(request);
                await SecureLoggerService.info(`Hentet personen motpart-barn relasjon for ident ${request.ident}`);
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til relasjoner for person ${request.ident}`);
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

export function useHentPersonMotpartBarnRelasjonSuspense(request: PersonRequest | null, enabled: boolean = true) {
    return useSuspenseQuery<MotpartBarnRelasjonDto | undefined, AxiosError | TilgangsFeilError>({
        ...hentPersonMotpartBarnRelasjonQueryOptions(request, enabled),
        retry: false,
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

export function useHentFlerePersoninformasjon(identer: string[], enabled: boolean = true) {
    return useQueries({
        queries: identer.map((ident) => ({
            queryKey: ["hent_personinformasjon", ident],
            queryFn: async () => {
                try {
                    const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident });
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
