import { BIDRAG_PERSON_API, BIDRAG_SAMHANDLER_API, TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import type { SamhandlerDto } from "@bidrag/api/SamhandlerApi";
import { IdentUtils, ObjectUtils, SecureLoggerService } from "@bidrag/common";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export type Mottakertype = "PERSON" | "SAMHANDLER";
const INGEN_TREFF_FEILMELDING = "Ingen treff på oppgitt ident";

export type ISamhandlerPersonInfo = PersonDto & {
    ident: string;
    navn?: string;
    offentligId?: string;
    mottakertype?: Mottakertype;
    isValid: boolean;
    søktIdent?: string;
};

export function useHentSamhandler(ident: string, enabled: boolean = true) {
    return useQuery({
        ...hentSamhandlerQuery(ident, enabled),
    });
}

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

export const useHentSamhandlerEllerPersonForIdent = (sjekkSamhandler: boolean = true) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ident }: { ident: string }): Promise<ISamhandlerPersonInfo> => {
            if (ObjectUtils.isEmpty(ident)) return { ident, visningsnavn: "", isValid: false };

            const queryKey = ["hent_samhandler_eller_person", ident];

            const cachedData = queryClient.getQueryData<ISamhandlerPersonInfo>(queryKey);
            if (
                cachedData?.isValid &&
                (cachedData.mottakertype === "PERSON" || cachedData.mottakertype === "SAMHANDLER")
            ) {
                return cachedData;
            }

            const result = await hentSamhandlerEllerPersonForIdent(ident, sjekkSamhandler);

            queryClient.setQueryData(queryKey, result);
            return result;
        },
        throwOnError: false,
        retry: 2,
    });
};

async function hentSamhandlerEllerPersonForIdent(
    ident: string,
    sjekkSamhandler: boolean,
): Promise<ISamhandlerPersonInfo> {
    if (IdentUtils.isSamhandlerId(ident) && sjekkSamhandler) return hentSamhandlerForIdent(ident);
    if (IdentUtils.isFnr(ident)) return hentPersonForIdent(ident);
    return { ident, visningsnavn: "", isValid: false, søktIdent: ident };
}

async function hentSamhandlerForIdent(ident: string): Promise<ISamhandlerPersonInfo> {
    const response = await BIDRAG_SAMHANDLER_API.samhandler
        .hentSamhandler(JSON.stringify(ident))
        .catch((error) => håndterHenteFeil(ident, error));

    if (response.status !== 200) {
        if (response.status === 404) return håndterHenteFeil(ident, new Error(INGEN_TREFF_FEILMELDING));
        return håndterHenteFeil(ident, new Error(`Samhandleroppslaget ga uventet status ${response.status}`));
    }
    if (!response.data?.samhandlerId) {
        return håndterHenteFeil(ident, new Error(`Samhandler mangler id for ident ${ident}`));
    }

    return {
        ident: response.data.samhandlerId,
        navn: response.data.navn,
        visningsnavn: response.data.navn,
        offentligId: response.data.offentligId,
        mottakertype: "SAMHANDLER",
        isValid: true,
        søktIdent: ident,
    };
}

async function hentPersonForIdent(ident: string): Promise<ISamhandlerPersonInfo> {
    const response = await BIDRAG_PERSON_API.informasjon
        .hentPersonPost({ ident })
        .catch((error) => håndterHenteFeil(ident, error));

    if (response.status !== 200) {
        if (response.status === 404) return håndterHenteFeil(ident, new Error(INGEN_TREFF_FEILMELDING));
        return håndterHenteFeil(ident, new Error(`Personoppslaget ga uventet status ${response.status}`));
    }

    return response.data?.ident
        ? {
              ...response.data,
              navn: response.data.visningsnavn,
              visningsnavn: response.data.visningsnavn,
              ident: response.data.ident,
              offentligId: response.data.aktørId ?? undefined,
              mottakertype: "PERSON",
              isValid: true,
              søktIdent: ident,
          }
        : { ident, visningsnavn: "", isValid: false, søktIdent: ident };
}

async function håndterHenteFeil(ident: string, error: unknown): Promise<never> {
    await SecureLoggerService.warn(
        `Feil ved henting av samhandler eller person for ident ${ident} - antar ugyldig ident`,
        error instanceof Error ? error : new Error(String(error)),
    );
    const axiosError = error as AxiosError;
    const status = axiosError?.response?.status;

    if (status === 403 || status === 401) {
        await SecureLoggerService.warn(`Ingen tilgang til person ${ident}`);
        throw new Error(
            `Du har ikke tilgang til informasjon om denne personen ${ident}. Dette kan skyldes diskresjonskode eller manglende rettigheter.`,
        );
    }
    if (status === 404) throw new Error(INGEN_TREFF_FEILMELDING);
    throw error;
}
