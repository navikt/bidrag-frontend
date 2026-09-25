import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";
import { SecureLoggerService } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { beregnBarnMedUfullstendigRelasjon } from "./ufullstendig-relasjon-utils.ts";

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
