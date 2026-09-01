import { BIDRAG_PERSON_API, TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { withQueryErrorHandlingV2 } from "@bidrag/common";
import { queryOptions } from "@tanstack/react-query";

/**
 * Henter personinformasjon for en gitt ident. Hvis det oppstår en feil under henting av informasjonen gis tilbake en person med maskert visningsnavn
 */
export function hentPersonInfoMedMaskering(ident: string, maskeringVedFeil = true) {
    return queryOptions({
        queryKey: ["hent_personinformasjon", ident, maskeringVedFeil],
        queryFn: () =>
            withQueryErrorHandlingV2("hent_personinformasjon", async () => {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({
                    ident,
                });
                return data;
            }).catch((error) => {
                if (maskeringVedFeil && error instanceof TilgangsFeilError) {
                    const maskertPerson: PersonDto = {
                        ident: ident,
                        visningsnavn: "* ingen tilgang *",
                    };
                    return maskertPerson;
                } else {
                    throw error;
                }
            }),
        enabled: ident.length === 11,
        staleTime: Infinity,
    });
}
