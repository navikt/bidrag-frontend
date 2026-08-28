import {BIDRAG_TILGANGSKONTROLL_API} from "@bidrag/api";
import {queryOptions} from "@tanstack/react-query";
import {withQueryErrorHandlingV2} from "../query";

export function sjekkTilgangSak(saksnummer?: string) {
    return queryOptions({
        queryKey: ["sjekkTilgangSakV2", saksnummer],
        queryFn: () =>
            withQueryErrorHandlingV2(
                "sjekkTilgangSakV2",
                async () => {
                    const {data} = await BIDRAG_TILGANGSKONTROLL_API.v2.sjekkTilgangSakV2({saksnummer: saksnummer ?? ""});
                    return data;
                },
            ),
        enabled: !!saksnummer,
        staleTime: 2 * 60 * 1000, // 2 minutter
    });
}

export function sjekkTilgangPerson(personident: string) {
    return queryOptions({
        queryKey: ["sjekkTilgangPerson", personident],
        queryFn: () =>
            withQueryErrorHandlingV2(
                "sjekkTilgangPerson",
                async () => {
                    const {data} = await BIDRAG_TILGANGSKONTROLL_API.v2.sjekkTilgangPerson({personident: personident});
                    return data;
                },
            ),
        staleTime: 2 * 60 * 1000, // 2 minutter
    });
}
