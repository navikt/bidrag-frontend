import { BIDRAG_SAMHANDLER_API, TilgangsFeilError } from "@bidrag/api";
import type { SamhandlerDto } from "@bidrag/api/SamhandlerApi";
import { IdentUtils, SecureLoggerService } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export function hentSamhandlerQuery(ident: string, enabled: boolean = true) {
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
                const axiosError = e as AxiosError;
                const status = axiosError?.response?.status;

                if (status === 403 || status === 401) {
                    await SecureLoggerService.warn(`Ingen tilgang til samhandler ${ident}`);
                    throw new TilgangsFeilError("Du har ikke tilgang til denne samhandleren");
                }
                throw e;
            }
        },
        staleTime: Infinity,
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
