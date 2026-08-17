import { BIDRAG_ADMIN_API } from "@bidrag/api";
import type {
    EndringsLoggDto,
    EndringsloggTilhorerSkjermbilde,
    OppdaterEndringsloggRequest,
    OpprettEndringsloggRequest,
} from "@bidrag/api/BidragAdminApi";
import { LoggerService } from "@bidrag/common";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

export const useHentEndringslogger = () => {
    return useSuspenseQuery<EndringsLoggDto[]>({
        queryKey: ["endringslogger"],
        queryFn: async (): Promise<EndringsLoggDto[]> => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.hentAlleEndringslogg({ bareAktive: false });
            return data;
        },
    });
};

export const useCreateEndringslogg = () => {
    return useMutation({
        mutationKey: ["createUpdateEndringslogg"],
        mutationFn: async (payload: OpprettEndringsloggRequest): Promise<EndringsLoggDto> => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.opprettEndringslogg(payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            LoggerService.error("Feil ved oppreting av endringslogg", error);
        },
    });
};

export const useEditEndringslogg = () => {
    return useMutation({
        mutationKey: ["createUpdateEndringslogg"],
        mutationFn: async ({
            endringsloggId,
            payload,
        }: {
            endringsloggId: number;
            payload: OppdaterEndringsloggRequest;
        }): Promise<EndringsLoggDto> => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.oppdaterEndringslogg(endringsloggId, payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            LoggerService.error("Feil ved oppdatering av endringslogg", error);
        },
    });
};

export const useHentEndringslogg = (endringsloggId?: number) => {
    return useSuspenseQuery({
        queryKey: ["endringslogg", endringsloggId],
        queryFn: async (): Promise<EndringsLoggDto> => {
            if (!endringsloggId) return {} as EndringsLoggDto;
            const { data } = await BIDRAG_ADMIN_API.endringslogg.hentEndringslogg(endringsloggId);
            return data;
        },
    });
};

export const useAktiverEndringslogg = () => {
    return useMutation({
        mutationFn: async (endringsloggId: number): Promise<EndringsLoggDto> => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.aktiverEndringslogg(endringsloggId);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            LoggerService.error("Feil ved aktivering av endringslogg", error);
        },
    });
};

export const useDeaktiverEndringslogg = () => {
    return useMutation({
        mutationFn: async (endringsloggId: number): Promise<EndringsLoggDto> => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.deaktiverEndringslogg(endringsloggId);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            LoggerService.error("Feil ved deaktivering av endringslogg", error);
        },
    });
};

export const useSlettEndringslogg = () => {
    return useMutation({
        mutationFn: async (endringsloggId: number): Promise<void> => {
            await BIDRAG_ADMIN_API.endringslogg.slettEndringslogg(endringsloggId);
        },
        networkMode: "always",
        onError: (error) => {
            LoggerService.error("Feil ved sletting av endringslogg", error);
        },
    });
};

export const useGetEndringsloggForBruker = (skjermbilde?: EndringsloggTilhorerSkjermbilde) => {
    return useQuery<EndringsLoggDto[]>({
        queryKey: ["endringslogg_bruker", skjermbilde],
        queryFn: async () => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.hentAlleEndringslogg({
                bareAktive: true,
                skjermbilde,
            });
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useLestAvBrukerEndringslogg = (skjermbilde?: EndringsloggTilhorerSkjermbilde) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (endringsloggId: number): Promise<EndringsLoggDto> => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.oppdaterLestAvBrukerEndringslogg(endringsloggId, {
                lesetidVarighetMs: 0,
            });
            return data;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<EndringsLoggDto[]>(
                ["endringslogg_bruker", skjermbilde],
                (prev) => prev?.map((e) => (e.id === updated.id ? updated : e)) ?? prev,
            );
        },
    });
};

export const useLestAvBrukerEndring = (endringsloggId: number, skjermbilde?: EndringsloggTilhorerSkjermbilde) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            endringId,
            lesetidVarighet,
        }: {
            endringId: number;
            lesetidVarighet: number;
        }): Promise<EndringsLoggDto> => {
            const { data } = await BIDRAG_ADMIN_API.endringslogg.oppdaterLestAvBrukerEndring(
                endringsloggId,
                endringId,
                { lesetidVarighetMs: lesetidVarighet },
            );
            return data;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<EndringsLoggDto[]>(
                ["endringslogg_bruker", skjermbilde],
                (prev) => prev?.map((e) => (e.id === updated.id ? updated : e)) ?? prev,
            );
        },
    });
};
