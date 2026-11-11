import type { HentePersonidenterRequest, PersonRequest } from "@bidrag/api/PersonApi";
import { useQuery } from "@tanstack/react-query";
import {
    hentGeografiskTilknytning,
    hentPersonAdresser,
    hentPersonidenter,
    hentPersoninformasjonDetaljer,
    hentSivilstand,
} from "~/api/query/person.query.ts";

export function usePersonInformation(request: HentePersonidenterRequest) {
    const { data, isLoading, error } = useQuery(hentPersonidenter(request));
    return {
        personidenter: data,
        isPersonidenterLoading: isLoading,
        personidenterError: error,
    };
}

export function useHentSivilstand(request: PersonRequest, enabled: boolean = true) {
    const { data, isLoading, error } = useQuery(hentSivilstand(request, enabled));
    return {
        sivilstand: data,
        isSivilstandLoading: isLoading,
        sivilstandError: error,
    };
}

export function useHentPersonAdresser(
    request: {
        personident: any;
        "hente-postadresse"?: any;
    } | null,
    enabled: boolean = true,
) {
    const { data, isLoading, error } = useQuery(hentPersonAdresser(request, enabled));
    return {
        personadresser: data,
        isPersonAdresserLoading: isLoading,
        personadresserError: error,
    };
}

export function useHentPersoninformasjonDetaljer(request: PersonRequest | null, enabled: boolean = true) {
    const { data, isLoading, error } = useQuery(hentPersoninformasjonDetaljer(request, enabled));
    return {
        personinformasjonDetaljer: data,
        isPersoninformasjonDetaljerLoading: isLoading,
        personinformasjonDetaljerError: error,
    };
}

export function useHentGeografiskTilknytning(request: PersonRequest | null, enabled: boolean = true) {
    const { data, isLoading, error } = useQuery(hentGeografiskTilknytning(request, enabled));
    return {
        geografiskTilknytning: data,
        isGeografiskTilknytningLoading: isLoading,
        geografiskTilknytningError: error,
    };
}
