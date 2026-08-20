import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Sjekker om barn i saken har ufullstendig/manglende relasjon til begge foreldrene.
 */
export function useUfullstendigRelasjonSjekk() {
    const queryClient = useQueryClient();

    const hentForelderBarnRelasjon = useCallback(
        async (ident: string): Promise<ForelderBarnRelasjonDto> => {
            return queryClient.fetchQuery({
                queryKey: ["hent_forelder_barn_relasjon", ident],
                queryFn: async () => {
                    const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1({ ident });
                    await SecureLoggerService.info(`Hentet forelder-barn relasjon for ident ${ident}`);
                    return data;
                },
            });
        },
        [queryClient],
    );

    const harUfullstendigRelasjon = useCallback(
        async (barn: string[], bidragsmottaker?: string, bidragspliktig?: string): Promise<boolean> => {
            if (!bidragsmottaker || !bidragspliktig) {
                return true;
            }

            const resultat = await Promise.all(
                barn.map(async (barnIdent) => {
                    const relasjon = await hentForelderBarnRelasjon(barnIdent);

                    const foreldreIdent = relasjon.forelderBarnRelasjon
                        .filter((i) => i.minRolleForPerson === "BARN")
                        .map((i) => i.relatertPersonsIdent);

                    if (foreldreIdent.length < 2) {
                        return true;
                    }

                    const harBidragsmottaker = foreldreIdent.includes(bidragsmottaker);
                    const harBidragspliktig = foreldreIdent.includes(bidragspliktig);

                    return !harBidragsmottaker || !harBidragspliktig;
                }),
            );

            return resultat.some((erUfullstendig) => erUfullstendig);
        },
        [hentForelderBarnRelasjon],
    );

    return { harUfullstendigRelasjon };
}
