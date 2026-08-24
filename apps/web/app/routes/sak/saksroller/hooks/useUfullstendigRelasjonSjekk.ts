import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

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

    const finnBarnMedUfullstendigRelasjon = useCallback(
        async (barn: string[], bidragsmottaker?: string, bidragspliktig?: string): Promise<string[]> => {
            return beregnBarnMedUfullstendigRelasjon(barn, bidragsmottaker, bidragspliktig, hentForelderBarnRelasjon);
        },
        [hentForelderBarnRelasjon],
    );

    return { finnBarnMedUfullstendigRelasjon };
}

export async function beregnBarnMedUfullstendigRelasjon(
    barn: string[],
    bidragsmottaker: string | undefined,
    bidragspliktig: string | undefined,
    hentRelasjon: (ident: string) => Promise<ForelderBarnRelasjonDto>,
): Promise<string[]> {
    if (!bidragsmottaker || !bidragspliktig) {
        return barn;
    }

    const resultat = await Promise.all(
        barn.map(async (barnIdent) => {
            const relasjon = await hentRelasjon(barnIdent);

            const foreldreIdent = relasjon.forelderBarnRelasjon
                .filter((i) => i.minRolleForPerson === "BARN")
                .map((i) => i.relatertPersonsIdent);

            if (foreldreIdent.length < 2) {
                return barnIdent;
            }

            const manglerPart = !foreldreIdent.includes(bidragsmottaker) || !foreldreIdent.includes(bidragspliktig);

            return manglerPart ? barnIdent : null;
        }),
    );

    return resultat.filter((ident): ident is string => ident !== null);
}
