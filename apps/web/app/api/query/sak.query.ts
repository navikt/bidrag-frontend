import { BIDRAG_SAK_API } from "@bidrag/api";
import type { BidragssakDto } from "@bidrag/api/SakApi";
import { withQueryErrorHandlingV2 } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";

export function hentSakerForPerson(ident: string) {
    return queryOptions({
        queryKey: ["hentSakerForPerson", ident],
        queryFn: () =>
            withQueryErrorHandlingV2<BidragssakDto[]>(
                "hentSakerForPerson",
                async () => {
                    const { data } = await BIDRAG_SAK_API.person.finnForFodselsnummer(JSON.stringify(ident));
                    return data;
                },
                {
                    notFoundValue: [],
                },
            ),
        enabled: !!ident,
        staleTime: Infinity,
    });
}
