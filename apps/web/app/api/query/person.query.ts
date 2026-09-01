import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { withQueryErrorHandlingV2 } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";

export function hentPersonInfo(ident: string, maskeringVedFeil = true) {
    return queryOptions({
        queryKey: ["hent_personinformasjon", ident],
        queryFn: () =>
            withQueryErrorHandlingV2("hent_personinformasjon", async () => {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                    ident,
                });
                return data;
            }).catch((error) => {
                if (maskeringVedFeil) {
                    const maskertPerson: PersonDto = {
                        ident: ident,
                        visningsnavn: "* ingen tilgang *",
                    };
                    return maskertPerson;
                } else {
                    throw error;
                }
            }),
        staleTime: Infinity,
    });
}
