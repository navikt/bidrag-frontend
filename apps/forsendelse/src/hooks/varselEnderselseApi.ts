import type {
    OppdaterEttersendingsoppgaveRequest,
    OpprettEttersendingsoppgaveRequest,
    SlettEttersendingsoppgave,
    SlettEttersendingsoppgaveVedleggRequest,
} from "@bidrag/api/BidragForsendelseApi";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useBidragForsendelseApi } from "../api/api";
import { useErrorContext } from "../context/ErrorProvider";
import { formatApiErrorMessage } from "../utils/ErrorUtils";
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
    const { addError, resetError } = useErrorContext();
    return useMutation({
        mutationFn: async (data: OpprettEttersendingsoppgaveRequest) => {
            resetError();
            return bidragForsendelseApi.api.opprettEttersendingsoppgave(data);
        },
        onError: (error: AxiosError) => {
            addError({ message: formatApiErrorMessage("Kunne ikke opprette ettersendingsoppgave", error) });
        },
    });
};
export const useOppdaterVarselEttersendelse = () => {
    const bidragForsendelseApi = useBidragForsendelseApi();
    const { addError, resetError } = useErrorContext();
    return useMutation({
        mutationFn: async (data: OppdaterEttersendingsoppgaveRequest) => {
            resetError();
            return bidragForsendelseApi.api.oppdaterEttesendingsoppgave(data);
        },
        onError: (error: AxiosError) => {
            addError({ message: formatApiErrorMessage("Kunne ikke oppdatere ettersendingsoppgave", error) });
        },
    });
};
export const useSlettVarselEttersendelseDokument = () => {
    const bidragForsendelseApi = useBidragForsendelseApi();
    const { addError, resetError } = useErrorContext();
    return useMutation({
        mutationFn: async (data: SlettEttersendingsoppgaveVedleggRequest) => {
            resetError();
            return bidragForsendelseApi.api.slettEttersendingsoppgaveVedlegg(data);
        },
        onError: (error: AxiosError) => {
            addError({
                message: formatApiErrorMessage("Kunne ikke slette vedlegg fra ettersendingsoppgaven", error),
            });
        },
    });
};
export const useSlettVarselEttersendelse = () => {
    const bidragForsendelseApi = useBidragForsendelseApi();
    const { addError, resetError } = useErrorContext();
    return useMutation({
        mutationFn: async (data: SlettEttersendingsoppgave) => {
            resetError();
            return bidragForsendelseApi.api.slettEttersendingsoppgave(data);
        },
        onError: (error: AxiosError) => {
            addError({ message: formatApiErrorMessage("Kunne ikke slette ettersendingsoppgave", error) });
        },
    });
};
