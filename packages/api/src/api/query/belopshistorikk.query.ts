import { SecureLoggerService } from "@bidrag/common";

import { BIDRAG_BELOPSHISTORIKK_API } from "../../api";
import { withQueryErrorHandling } from "./withQueryErrorHandling";

export function hentBelopshistorikkQuery(saksnummer: string) {
    return {
        queryKey: ["hent_belopshistorikk", saksnummer],
        queryFn: () =>
            withQueryErrorHandling(
                "hent_belopshistorikk",
                async () => {
                    const { data } = await BIDRAG_BELOPSHISTORIKK_API.hentStonaderForSak.hentStonaderForSak(saksnummer);
                    await SecureLoggerService.info(`Hentet beløpshistorikk for sak ${saksnummer}`);
                    return data;
                },
                { saksnummer }
            ),
    };
}

export function hentEngangsbetalingerQuery(saksnummer: string) {
    return {
        queryKey: ["hent_engangsbetalinger", saksnummer],
        queryFn: () =>
            withQueryErrorHandling(
                "hent_belopshistorikk",
                async () => {
                    const { data } = await BIDRAG_BELOPSHISTORIKK_API.engangsbelop.hentEngangsbelopForSak(saksnummer);
                    await SecureLoggerService.info(`Hentet engangsbetalinger for sak ${saksnummer}`);
                    return data;
                },
                { saksnummer }
            ),
    };
}
