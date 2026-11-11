import { BIDRAG_PERSON_API, BIDRAG_SAMHANDLER_API, TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import type { SamhandlerDto } from "@bidrag/api/SamhandlerApi";
import { IdentUtils, ObjectUtils, SecureLoggerService } from "@bidrag/common";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export type ISamhandlerPersonInfo = PersonDto & {
    ident: string;
    navn?: string;
    offentligId?: string;
    isValid: boolean;
    søktIdent?: string;
};

/** Samme nøkkel som `hentSamhandlerQuery` i apps/web, slik at cachen deles. */
function hentSamhandlerQuery(ident: string, enabled: boolean = true) {
    return queryOptions({
        queryKey: ["hent_samhandler", ident],
        queryFn: async () => {
            try {
                if (!IdentUtils.isSamhandlerId(ident)) {
                    return { samhandlerId: ident } as SamhandlerDto;
                }
                const { data } = await BIDRAG_SAMHANDLER_API.samhandler.hentSamhandler(JSON.stringify(ident));
                await SecureLoggerService.info(`Hentet samhandler for ident ${ident}`);
                return data;
            } catch (e) {
                const status = (e as AxiosError)?.response?.status;
                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til samhandler ${ident}`);
                    throw new TilgangsFeilError("Du har ikke tilgang til denne samhandleren");
                }
                throw e;
            }
        },
        staleTime: Infinity,
        enabled: enabled && !!ident,
        retry: (failureCount, error) => !(error instanceof TilgangsFeilError) && failureCount < 1,
        throwOnError: false,
    });
}

export function useHentSamhandler(ident: string, enabled: boolean = true) {
    return useQuery({
        ...hentSamhandlerQuery(ident, enabled),
    });
}

export const useHentSamhandlerEllerPersonForIdent = (sjekkSamhandler: boolean = true) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ident }: { ident: string }): Promise<ISamhandlerPersonInfo> => {
            if (ObjectUtils.isEmpty(ident)) return { ident, visningsnavn: "", isValid: false };

            const queryKey = ["hent_samhandler_eller_person", ident];

            const cachedData = queryClient.getQueryData<ISamhandlerPersonInfo>(queryKey);
            if (cachedData) {
                return cachedData;
            }

            let result: ISamhandlerPersonInfo;

            try {
                if (IdentUtils.isSamhandlerId(ident) && sjekkSamhandler) {
                    const response = await BIDRAG_SAMHANDLER_API.samhandler.hentSamhandler(JSON.stringify(ident));
                    if (response.status !== 200) throw Error(`Fant ikke samhandler med ident ${ident}`);
                    if (!response.data.samhandlerId) throw Error(`Samhandler mangler id for ident ${ident}`);
                    result = {
                        ident: response.data.samhandlerId,
                        navn: response.data.navn,
                        visningsnavn: response.data.navn,
                        offentligId: response.data.offentligId,
                        isValid: true,
                        søktIdent: ident,
                    };
                } else if (IdentUtils.isFnr(ident)) {
                    const response = await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                        ident,
                    });

                    if (response.status !== 200) throw Error(`Fant ikke person med ident ${ident}`);
                    result = {
                        ...response.data,
                        navn: response.data.visningsnavn,
                        visningsnavn: response.data.visningsnavn,
                        ident: response.data.ident,
                        offentligId: response.data.aktørId ?? undefined,
                        isValid: true,
                        søktIdent: ident,
                    };
                } else {
                    result = { ident, visningsnavn: "", isValid: false, søktIdent: ident };
                }
            } catch (e) {
                await SecureLoggerService.warn(
                    `Feil ved henting av samhandler eller person for ident ${ident} - antar ugyldig ident`,
                    e instanceof Error ? e : new Error(String(e)),
                );
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til person ${ident}`);
                    throw new Error(
                        `Du har ikke tilgang til informasjon om denne personen ${ident}. Dette kan skyldes diskresjonskode eller manglende rettigheter.`,
                    );
                }
                throw e;
            }

            queryClient.setQueryData(queryKey, result);
            return result;
        },
        throwOnError: false,
        retry: 2,
    });
};
