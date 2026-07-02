import { BIDRAG_VEDTAK_API } from "@bidrag/api";
import { SecureLoggerService } from "@bidrag/common";
import { withQueryErrorHandling } from "./withQueryErrorHandling.ts";

export function hentVedtakQuery(vedtaksId: number) {
    return {
        queryKey: ["hent_vedtak", vedtaksId],
        queryFn: () =>
            withQueryErrorHandling(
                "hent_vedtak",
                async () => {
                    if (!vedtaksId) throw new Error("Vedtaksid is required");
                    const { data } =
                        await BIDRAG_VEDTAK_API.vedtak.hentVedtak(vedtaksId);
                    await SecureLoggerService.info(
                        `Hentet vedtak  ${vedtaksId}`,
                    );
                    return data;
                },
                { vedtaksId },
            ),
    };
}
