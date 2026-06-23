import { SecureLoggerService } from "@navikt/bidrag-ui-common";

import { BIDRAG_VEDTAK_API } from "../../api";
import { withQueryErrorHandling } from "./withQueryErrorHandling";

export function hentVedtakQuery(vedtaksId: number) {
    return {
        queryKey: ["hent_vedtak", vedtaksId],
        queryFn: () =>
            withQueryErrorHandling(
                "hent_vedtak",
                async () => {
                    if (!vedtaksId) throw new Error("Vedtaksid is required");
                    const { data } = await BIDRAG_VEDTAK_API.vedtak.hentVedtak(vedtaksId);
                    await SecureLoggerService.info(`Hentet vedtak  ${vedtaksId}`);
                    return data;
                },
                { vedtaksId }
            ),
    };
}
