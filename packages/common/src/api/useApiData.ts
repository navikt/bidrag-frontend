import { useSuspenseQuery } from "@tanstack/react-query";

import { StringUtils } from "../utils";
import { BIDRAG_PERSON_API } from "@bidrag/api";
import type { Graderingsinfo, PersonDto } from "@bidrag/api/PersonApi";

const getKey = (ident?: string) => ["persons", ident ?? "ukjent"];

export const useHentPersonData = (ident?: string) => {
    return useSuspenseQuery({
        queryKey: getKey(ident),
        queryFn: async (): Promise<PersonDto> => {
            if (!ident || StringUtils.isEmpty(ident)) return { ident: "", visningsnavn: "Ukjent" };
            const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident: ident });
            return data;
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
