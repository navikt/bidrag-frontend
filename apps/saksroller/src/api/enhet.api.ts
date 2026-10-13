import { BIDRAG_ORGANISASJON_API, TilgangsFeilError } from "@bidrag/api";
import type { EnhetDto, HentEnhetRequest } from "@bidrag/api/OrganisasjonApi";
import { SecureLoggerService } from "@bidrag/common";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export function hentPersonGeografiskEnhetQueryOptions(request: HentEnhetRequest | null, enabled: boolean = true) {
    return {
        queryKey: ["hent_person_geografisk_enhet", request],
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
                    await SecureLoggerService.warn(`Ingen tilgang til å hente enheter for ident ${request.ident}`);
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

/** Navnet på en enhet. Deler cache med web via `hent_enhet_info`. */
export function useEnhetsnavn(enhetsnummer: string, aktiv: boolean) {
    const { data, isLoading, isFetching, error } = useQuery<EnhetDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_enhet_info", enhetsnummer],
        queryFn: async () => {
            try {
                const { data } = await BIDRAG_ORGANISASJON_API.enhet.hentEnhetInfo(enhetsnummer);
                await SecureLoggerService.info(`Hentet enhetsinformasjon for enhet ${enhetsnummer}`);
                return data;
            } catch (e) {
                const status = (e as AxiosError)?.response?.status;
                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(
                        `Ingen tilgang til å hente enhetsinformasjon for enhet ${enhetsnummer}`,
                    );
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til å hente informasjon om denne enheten ${enhetsnummer}`,
                    );
                }
                throw e;
            }
        },
        enabled: aktiv && !!enhetsnummer,
        retry: (failureCount, error) => !(error instanceof TilgangsFeilError) && failureCount < 1,
        throwOnError: false,
    });
    return { navn: data?.navn, isLoading: isLoading || isFetching, error };
}
