import { BIDRAG_PERSON_API, TilgangsFeilError } from "@bidrag/api";
import type { MotpartBarnRelasjonDto, PersonDto, PersonRequest } from "@bidrag/api/PersonApi";
import { SecureLoggerService, StringUtils } from "@bidrag/common";
import { useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { QueryKeys } from "./sak.api";

export const useHentPersonData = (ident?: string) => {
    return useQuery({
        queryKey: QueryKeys.hentPersoninfo(ident ?? ""),
        queryFn: async (): Promise<PersonDto> => {
            if (!ident || StringUtils.isEmpty(ident)) return { ident: "", visningsnavn: "Ukjent" };
            const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident: ident });
            return data;
        },
        enabled: !!ident && !StringUtils.isEmpty(ident),
        staleTime: Infinity,
        throwOnError: false,
    });
};

export function useHentFlerePersoninformasjonSuspense(identer: string[], enabled: boolean = true) {
    return useSuspenseQueries({
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
            staleTime: Infinity,
            retry: (failureCount: number, error: Error) => {
                if (error instanceof TilgangsFeilError) {
                    return false;
                }
                return failureCount < 1;
            },
            throwOnError: true,
        })),
    });
}

export function hentPersonMotpartBarnRelasjonQueryOptions(request: PersonRequest | null) {
    return {
        queryKey: ["hent_person_motpart_barn_relasjon", request?.ident],
        queryFn: async (): Promise<MotpartBarnRelasjonDto | undefined> => {
            if (!request) return undefined;
            try {
                const { data } = await BIDRAG_PERSON_API.motpartbarnrelasjon.getPersonensMotpartBarnRelasjon(request);
                await SecureLoggerService.info("Hentet personen motpart-barn relasjon");
                return data;
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn("Ingen tilgang til personens relasjoner");
                    throw new TilgangsFeilError("Du har ikke tilgang til å hente personens relasjoner.");
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

export function useHentPersonMotpartBarnRelasjon(request: PersonRequest | null, enabled: boolean = true) {
    return useQuery<MotpartBarnRelasjonDto | undefined, AxiosError | TilgangsFeilError>({
        ...hentPersonMotpartBarnRelasjonQueryOptions(request),
        enabled: enabled && !!request?.ident,
    });
}

export function useHentPersonMotpartBarnRelasjonSuspense(request: PersonRequest) {
    return useSuspenseQuery<MotpartBarnRelasjonDto | undefined, AxiosError | TilgangsFeilError>({
        ...hentPersonMotpartBarnRelasjonQueryOptions(request),
    });
}

export function hentForeldreinformasjonForBarnQueryOptions(request: PersonRequest | null) {
    return {
        queryKey: ["hent_foreldreinformasjon_for_barn", request?.ident],
        queryFn: async () => {
            if (!request?.ident) return [];

            try {
                const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1(request);

                const foreldreIdenter = data.forelderBarnRelasjon
                    .filter((relasjon) => relasjon.minRolleForPerson === "BARN")
                    .map((relasjon) => relasjon.relatertPersonsIdent)
                    .filter((ident): ident is string => ident !== undefined);

                if (foreldreIdenter.length === 0) {
                    return [];
                }

                SecureLoggerService.info("Hentet foreldre for barn").catch(console.error);

                const foreldreResponses = await Promise.all(
                    foreldreIdenter.map((ident) => BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident })),
                );

                return foreldreResponses.map((response) => response.data);
            } catch (e) {
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn("Ingen tilgang til foreldreinfo for barn");
                    throw new TilgangsFeilError("Du har ikke tilgang til foreldreinfo for barnet.");
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

/** Personen opprett sak-flyten åpnes for. Deler cache med web via `hent_personinformasjon`. */
export function useInngangsperson(ident: string) {
    const { data, error } = useQuery<PersonDto, AxiosError | TilgangsFeilError>({
        queryKey: ["hent_personinformasjon", ident],
        queryFn: async () => {
            try {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident });
                await SecureLoggerService.info(`Hentet personinformasjon for ident ${ident}`);
                return data;
            } catch (e) {
                const status = (e as AxiosError)?.response?.status;
                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til person ${ident}`);
                    throw new TilgangsFeilError(`Du har ikke tilgang til informasjon om denne personen ${ident}`);
                }
                throw e;
            }
        },
        enabled: !!ident,
        retry: (failureCount, error) => !(error instanceof TilgangsFeilError) && failureCount < 1,
        throwOnError: false,
    });
    return { person: data, error };
}
