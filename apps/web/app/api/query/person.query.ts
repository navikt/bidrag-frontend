import { BIDRAG_PERSON_API, TilgangsFeilError } from "@bidrag/api";
import type { HentePersonidenterRequest, PersonDto, PersonRequest } from "@bidrag/api/PersonApi";
import { SecureLoggerService, withQueryErrorHandlingV2 } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

/**
 * Henter personinformasjon for en gitt ident. Hvis tjenesten nekter tilgang returneres en person med maskert visningsnavn
 */
export function hentPersonInfoMedMaskering(ident: string, maskeringVedFeil = true) {
    return queryOptions({
        queryKey: ["hent_personinformasjon", ident, maskeringVedFeil],
        queryFn: () =>
            withQueryErrorHandlingV2("hent_personinformasjon", async () => {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                    ident,
                });
                return data;
            }).catch((error) => {
                if (maskeringVedFeil && error instanceof TilgangsFeilError) {
                    const maskertPerson: PersonDto = {
                        ident: ident,
                        visningsnavn: "* ingen tilgang *",
                    };
                    return maskertPerson;
                } else {
                    throw error;
                }
            }),
        enabled: ident.length === 11,
        staleTime: Infinity,
    });
}

/**
 * Henter alle personidenter for en gitt ident.
 */
export function hentPersonidenter(request: HentePersonidenterRequest, enabled: boolean = true) {
    return queryOptions({
        queryKey: ["hent_personidenter", request?.ident],
        queryFn: () =>
            withQueryErrorHandlingV2("hent_personidenter", async () => {
                const { data } = await BIDRAG_PERSON_API.personidenter.hentePersonidenter(request);
                return data;
            }).catch((error) => {
                const axiosError = error as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    SecureLoggerService.warn(`Ingen tilgang til person ${request.ident}`);
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til informasjon om denne personen ${request.ident}`,
                    );
                }
                throw error;
            }),
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    });
}

/**
 * Henter sivilstand for en gitt ident.
 */
export function hentSivilstand(request: PersonRequest | null, enabled: boolean = true) {
    return queryOptions({
        queryKey: ["hent_sivilstand", request?.ident],
        queryFn: async () => {
            if (!request) throw new Error("Request is required");
            try {
                const { data } = await BIDRAG_PERSON_API.sivilstand.hentSivilstand(request);
                await SecureLoggerService.info(`Hentet sivilstand for ident ${request.ident}`);
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

/**
 * Henter personadresser for en gitt ident.
 */
export function hentPersonAdresser(
    request: {
        personident: any;
        "hente-postadresse"?: any;
    } | null,
    enabled: boolean = true,
) {
    return queryOptions({
        queryKey: ["hent_personadresser", request?.personident],
        queryFn: async () => {
            if (!request) throw new Error("Request is required");
            try {
                const { data } = await BIDRAG_PERSON_API.adresse.hentPersonAdresser(request, {
                    ident: request.personident,
                });
                await SecureLoggerService.info(`Hentet personadresser for ident ${request.personident}`);
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til person ${request.personident}`);
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til personadresser om denne personen ${request.personident}`,
                    );
                }
                throw e;
            }
        },
        enabled: enabled && !!request?.personident,
        retry: (failureCount, error) => {
            if (error instanceof TilgangsFeilError) {
                return false;
            }
            return failureCount < 1;
        },
        throwOnError: false,
    });
}

/**
 * Henter personinformasjonsdetaljer for en gitt ident.
 */
export function hentPersoninformasjonDetaljer(request: PersonRequest | null, enabled: boolean = true) {
    return queryOptions({
        queryKey: ["hent_personinformasjon_detaljer", request?.ident],
        queryFn: async () => {
            if (!request) throw new Error("Request is required");
            try {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersoninformasjonDetaljer(request);
                await SecureLoggerService.info(`Hentet personinformasjondetaljer for ident ${request.ident}`);
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til person ${request.ident}`);
                    throw new TilgangsFeilError(
                        `Du har ikke tilgang til informasjondetaljer om denne personen ${request.ident}`,
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

/**
 * Henter geografisk tilknytning for en gitt ident.
 */
export function hentGeografiskTilknytning(request: PersonRequest | null, enabled: boolean = true) {
    return queryOptions({
        queryKey: ["hent_geografisktilknytning", request?.ident],
        queryFn: async () => {
            if (!request) throw new Error("Request is required");
            try {
                const { data } = await BIDRAG_PERSON_API.geografisktilknytning.hentGeografiskTilknytning(request);
                await SecureLoggerService.info(`Hentet geografisk tilknytning for ident ${request.ident}`);
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
