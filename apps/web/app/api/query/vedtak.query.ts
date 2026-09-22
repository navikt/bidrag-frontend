import { BIDRAG_VEDTAK_API } from "@bidrag/api";
import { SecureLoggerService, withQueryErrorHandling } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";
import {AxiosError} from "axios";

export function hentVedtakQuery(vedtaksId: number) {
    return queryOptions({
        queryKey: ["hent_vedtak", vedtaksId],
        queryFn: () =>
            withQueryErrorHandling(
                "hent_vedtak",
                async () => {
                    if (!vedtaksId) throw new Error("Vedtaksid is required");
                    try {
                        const { data } = await BIDRAG_VEDTAK_API.vedtak.hentVedtak(vedtaksId);
                        await SecureLoggerService.info(`Hentet vedtak  ${vedtaksId}`);
                        return data;
                    // biome-ignore lint/suspicious/noExplicitAny: Ignorerer for å logge feil
                    } catch (error: any) {
                        await SecureLoggerService.error(`Feil ved henting av vedtak  ${vedtaksId}`, error);
                        return null
                    }

                },
                { vedtaksId },
            ),
        staleTime: Infinity,
    });
}
