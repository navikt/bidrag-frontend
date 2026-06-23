import { SecureLoggerService } from "@navikt/bidrag-ui-common";
import { queryOptions } from "@tanstack/react-query";

import { BIDRAG_RESKONTRO_API } from "../../api";
import { withQueryErrorHandling } from "./withQueryErrorHandling";

export function hentReskontroTransaksjonerForSaksnummer(saksnummer: string) {
    return queryOptions({
        queryKey: ["hentReskontroTransaksjonerForSaksnummer", saksnummer],
        queryFn: () =>
            withQueryErrorHandling(
                "hentReskontroTransaksjonerForSaksnummer",
                async () => {
                    if (!saksnummer) throw new Error("saksnummer is required");
                    const { data } = await BIDRAG_RESKONTRO_API.transaksjoner.hentTransaksjonerPaBidragssak({
                        saksnummer: saksnummer,
                    });
                    await SecureLoggerService.info(`Hentet rekontro transaksjoner for sak  ${saksnummer}`);
                    return data;
                },
                { saksnummer }
            ),
    });
}

export function hentInnkrevingForSaksnummer(saksnummer: string) {
    return queryOptions({
        queryKey: ["hentInnkrevingForSaksnummer", saksnummer],
        queryFn: () =>
            withQueryErrorHandling("hentInnkrevingForSaksnummer", async () => {
                const { data } = await BIDRAG_RESKONTRO_API.innkrevningssak.hentInnkrevingssakPaBidragssak({
                    saksnummer: saksnummer,
                });
                return data;
            }),
    });
}

export function hentTransaksjonskoder() {
    return queryOptions({
        queryKey: ["hentTransaksjonskoder"],
        queryFn: () =>
            withQueryErrorHandling("hentTransaksjonskoder", async () => {
                const { data } = await BIDRAG_RESKONTRO_API.transaksjonskoder.hentTransaksjonskoder();
                return data;
            }),
        staleTime: Infinity,
    });
}
