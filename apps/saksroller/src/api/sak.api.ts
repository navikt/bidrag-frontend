import { BIDRAG_SAK_API, BIDRAG_TILGANGSKONTROLL_API, TilgangsFeilError } from "@bidrag/api";
import type {
    BidragssakDto,
    OppdaterRollerISakRequest,
    OppdaterSakResponse,
    OpprettSakRequest,
} from "@bidrag/api/SakApi";
import { SecureLoggerService } from "@bidrag/common";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const QueryKeys = {
    kanOppretteSak: ["tilgang_sak_uten_bm"],
    hentSak: (saksnummer: string) => ["hent_sak", saksnummer],
    hentPersoninfo: (ident: string) => ["hent_personinfo", ident],
};

export function useSjekkTilgangOpprettSakUtenBm(enabled: boolean = true) {
    return useQuery<boolean, never>({
        queryKey: ["sjekk_tilgang_opprett_sak_uten_bm"],
        queryFn: async () => {
            try {
                const response = await BIDRAG_TILGANGSKONTROLL_API.v2.sjekkTilgangOpprettSakUtenBm();

                await SecureLoggerService.info(
                    `Tilgangssjekk for opprettelse av sak uten BM: ${response.data.harTilgang ? "Har tilgang" : "Ingen tilgang"}`,
                );

                return response.data.harTilgang;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.info("Saksbehandleren mangler tilgang til å opprette sak uten BM");
                } else {
                    await SecureLoggerService.warn(
                        "Feil ved tilgangssjekk sak uten BM - antar ingen tilgang",
                        e instanceof Error ? e : new Error(String(e)),
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

export const OPPRETT_SAK_MUTATION_KEY = ["opprett_sak"];

export function useOpprettSak() {
    return useMutation<string, AxiosError<string> | TilgangsFeilError, OpprettSakRequest>({
        mutationKey: OPPRETT_SAK_MUTATION_KEY,
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
                if (e instanceof AxiosError) {
                    throw new Error(e.response?.headers.warning || "Feil ved opprettelse av sak");
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

export function useHentSakForPerson(ident: string, enabled: boolean = true) {
    return useQuery<BidragssakDto[], AxiosError | TilgangsFeilError>({
        queryKey: ["hent_sak_person", ident],
        queryFn: async () => {
            try {
                const response = await BIDRAG_SAK_API.person.finnForFodselsnummer(JSON.stringify(ident), {
                    validateStatus: (status) => {
                        return status === 200 || status === 404;
                    },
                });

                if (response.status === 404) {
                    await SecureLoggerService.info(`Ingen saker funnet for person ${ident}`);
                    return [];
                }

                await SecureLoggerService.info(`Hentet sak for person ${ident}`);
                return response.data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til saker for person ${ident}`);
                    throw new TilgangsFeilError(`Du har ikke tilgang til sakene for denne personen (${ident})`);
                }
                await SecureLoggerService.error(
                    `Kunne ikke hente sak for person ${ident}`,
                    e instanceof Error ? e : new Error(String(e)),
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

export function useHentSakSuspense(saksnummer: string) {
    return useSuspenseQuery<BidragssakDto, AxiosError | TilgangsFeilError>({
        queryKey: QueryKeys.hentSak(saksnummer),
        queryFn: async () => {
            try {
                const response = await BIDRAG_SAK_API.bidragSak.findMetadataForSak(saksnummer, {
                    "vis-rollehistorikk": true,
                });
                await SecureLoggerService.info(`Hentet sak ${saksnummer}`);
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
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export function useOppdaterSaksroller() {
    return useMutation<OppdaterSakResponse, AxiosError | TilgangsFeilError, OppdaterRollerISakRequest>({
        mutationKey: ["oppdater_saksroller"],
        mutationFn: async (request: OppdaterRollerISakRequest) => {
            try {
                const response = await BIDRAG_SAK_API.sak.oppdaterSakRoller(request);
                const sak = response.data;
                await SecureLoggerService.info(
                    `Oppdaterte sak ${request.saksnummer} med request ${JSON.stringify(request)}`,
                );
                return sak;
            } catch (error) {
                const axiosError = error as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til oppdatering av sak ${request.saksnummer}`);
                    throw new TilgangsFeilError("Du har ikke tilgang til oppdatering av denne saken");
                }
                throw error;
            }
        },
    });
}
