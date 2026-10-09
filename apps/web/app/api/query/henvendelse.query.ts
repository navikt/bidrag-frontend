import { BIDRAG_HENVENDELSE_API } from "@bidrag/api";
import { withQueryErrorHandlingV2 } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";

export function hentHenvendelserForPerson(ident: string) {
    return queryOptions({
        queryKey: ["hentHenvendelserForPerson", ident],
        queryFn: () =>
            withQueryErrorHandlingV2("hentHenvendelserForPerson", async () => {
                const { data } = await BIDRAG_HENVENDELSE_API.henvendelser.hentHenvendelser({ ident });
                return data;
            }),
        enabled: !!ident,
    });
}
