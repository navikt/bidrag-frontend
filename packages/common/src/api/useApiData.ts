import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { Fodselsdatoer, Graderingsinfo, PersonDto } from "@bidrag/api/PersonApi";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { StringUtils } from "../utils";

const getKey = (ident?: string) => ["persons", ident ?? "ukjent"];

export const useHentPersonData = (ident?: string) => {
    return useSuspenseQuery({
        queryKey: getKey(ident),
        queryFn: async (): Promise<PersonDto> => {
            if (!ident || StringUtils.isEmpty(ident)) return { ident: "", visningsnavn: "Ukjent" };
            try {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident: ident });
                return data;
            } catch (error) {
                return { ident: "", visningsnavn: "Ingen tilgang", diskresjonskode: "SPSF" };
            }

        },
        staleTime: Infinity,
    });
};
export const useHentPersonSkjermingInfo = (ident?: string) => {
    return useSuspenseQuery({
        queryKey: getKey(ident),
        queryFn: async (): Promise<Graderingsinfo> => {
            if (!ident) return { identerTilGradering: {}, identerTilSkjerming: {} };
            const { data } = await BIDRAG_PERSON_API.graderingsinfo.hentGraderinger([ident]);
            return data;
        },
        staleTime: Infinity,
    });
};

/**
 * Henter fødselsdatoer (fra PDL via bidrag-person) for en liste med identer i ett kall.
 * Brukes bl.a. for å sortere barnerollene i `SakHeader` etter reell alder i stedet for å
 * regne alderen ut fra selve fødselsnummeret, som ikke fungerer for aktørId/NPID.
 *
 * Kjøres som en vanlig (ikke suspense) query siden den brukes til å forbedre en sortering
 * som allerede har et fungerende fallback mens dataene lastes.
 */
export const useHentFodselsdatoer = (identer: string[]) => {
    const sorterteIdenter = [...identer].sort();
    return useQuery({
        queryKey: ["fodselsdatoer", ...sorterteIdenter],
        queryFn: async (): Promise<Fodselsdatoer> => {
            const { data } = await BIDRAG_PERSON_API.fodselsdatoer.hentFodselsdatoer(sorterteIdenter);
            return data;
        },
        enabled: sorterteIdenter.length > 0,
        staleTime: Infinity,
    });
};
