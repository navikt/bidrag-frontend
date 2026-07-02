import { BIDRAG_RESKONTRO_API } from "@bidrag/api";
import { SecureLoggerService } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";
import { withQueryErrorHandling } from "./withQueryErrorHandling";

export function hentReskontroTransaksjonerForBruker(ident: string) {
    return queryOptions({
        queryKey: ["hentReskontroTransaksjonerForBruker", ident],
        queryFn: () =>
            withQueryErrorHandling(
                "hentReskontroTransaksjonerForBruker",
                async () => {
                    if (!ident) throw new Error("ident is required");
                    const { data } =
                        await BIDRAG_RESKONTRO_API.transaksjoner.hentTransaksjonerPaPerson(
                            {
                                ident: ident,
                            },
                        );
                    await SecureLoggerService.info(
                        `Hentet reskontro transaksjoner for bruker  ${ident}`,
                    );
                    return data;
                },
                { ident },
            ),
    });
}

export function hentReskontroTransaksjonerForSaksnummer(saksnummer: string) {
    return queryOptions({
        queryKey: ["hentReskontroTransaksjonerForSaksnummer", saksnummer],
        queryFn: () =>
            withQueryErrorHandling(
                "hentReskontroTransaksjonerForSaksnummer",
                async () => {
                    if (!saksnummer) throw new Error("saksnummer is required");
                    const { data } =
                        await BIDRAG_RESKONTRO_API.transaksjoner.hentTransaksjonerPaBidragssak(
                            {
                                saksnummer: saksnummer,
                            },
                        );
                    await SecureLoggerService.info(
                        `Hentet rekontro transaksjoner for sak  ${saksnummer}`,
                    );
                    return data;
                },
                { saksnummer },
            ),
    });
}

export function hentInnkrevingForSaksnummer(saksnummer: string) {
    return queryOptions({
        queryKey: ["hentInnkrevingForSaksnummer", saksnummer],
        queryFn: () =>
            withQueryErrorHandling("hentInnkrevingForSaksnummer", async () => {
                const { data } =
                    await BIDRAG_RESKONTRO_API.innkrevningssak.hentInnkrevingssakPaBidragssak(
                        {
                            saksnummer: saksnummer,
                        },
                    );
                return data;
            }),
    });
}

export function hentTransaksjonskoder() {
    return queryOptions({
        queryKey: ["hentTransaksjonskoder"],
        queryFn: () =>
            withQueryErrorHandling("hentTransaksjonskoder", async () => {
                const { data } =
                    await BIDRAG_RESKONTRO_API.transaksjonskoder.hentTransaksjonskoder();
                return data;
            }),
        staleTime: Infinity,
    });
}
