import type {
    OppdaterEttersendingsoppgaveRequest,
    OpprettEttersendingsoppgaveRequest,
    SlettEttersendingsoppgave,
    SlettEttersendingsoppgaveVedleggRequest,
} from "@bidrag/api/BidragForsendelseApi";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useBidragForsendelseApi } from "../api/api";
import { useHentForsendelseQuery } from "./useForsendelseApi";

export const useHentEksisterendeOppgaverForsendelse = () => {
    const forsendelse = useHentForsendelseQuery();
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useSuspenseQuery({
        queryKey: ["hentEksisterendeOppgaverForsendelse"],
        queryFn: async () => {
            return (
                await bidragForsendelseApi.api.hentEksisterendeEttersendingsoppgaverForsendelse(
                    forsendelse.forsendelseId,
                )
            ).data;
        },
    }).data;
};
export const useOpprettVarselEttersendelse = () => {
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useMutation({
        mutationFn: async (data: OpprettEttersendingsoppgaveRequest) => {
            return bidragForsendelseApi.api.opprettEttersendingsoppgave(data);
        },
    });
};
export const useOppdaterVarselEttersendelse = () => {
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useMutation({
        mutationFn: async (data: OppdaterEttersendingsoppgaveRequest) => {
            return bidragForsendelseApi.api.oppdaterEttesendingsoppgave(data);
        },
    });
};
export const useSlettVarselEttersendelseDokument = () => {
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useMutation({
        mutationFn: async (data: SlettEttersendingsoppgaveVedleggRequest) => {
            return bidragForsendelseApi.api.slettEttersendingsoppgaveVedlegg(data);
        },
    });
};
export const useSlettVarselEttersendelse = () => {
    const bidragForsendelseApi = useBidragForsendelseApi();
    return useMutation({
        mutationFn: async (data: SlettEttersendingsoppgave) => {
            return bidragForsendelseApi.api.slettEttersendingsoppgave(data);
        },
    });
};
