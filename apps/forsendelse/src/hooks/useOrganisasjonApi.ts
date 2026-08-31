import type { EnhetDto, JournalforendeEnhetDto } from "@bidrag/api/OrganisasjonApi";
import { SecuritySessionUtils } from "@bidrag/common";
import { type UseSuspenseQueryResult, useSuspenseQuery } from "@tanstack/react-query";
import { useBidragOrganisasjonApi } from "../api/api";

const OrganisasjonQueryKeys = {
    organisasjon: "organisasjon",
    hentJournalforendeEnheter: () => [OrganisasjonQueryKeys.organisasjon, "hentJournalforendeEnheter"],
    hentSaksbehandlerEnhetliste: () => [OrganisasjonQueryKeys.organisasjon, "hentSaksbehandlerEnhetliste"],
};

export const useHentJournalforendeEnheter = (): UseSuspenseQueryResult<JournalforendeEnhetDto[]> => {
    const bidragOrganisasjonApi = useBidragOrganisasjonApi();
    return useSuspenseQuery({
        queryKey: OrganisasjonQueryKeys.hentJournalforendeEnheter(),
        queryFn: () => bidragOrganisasjonApi.arbeidsfordeling.hentArbeidsfordelingJournalforendeEnheter(),
    });
};

export const useHentSaksbehandlerEnhetListe = (): UseSuspenseQueryResult<EnhetDto[]> => {
    const bidragOrganisasjonApi = useBidragOrganisasjonApi();
    return useSuspenseQuery({
        queryKey: OrganisasjonQueryKeys.hentSaksbehandlerEnhetliste(),
        queryFn: async () => {
            const saksbehandlerId = await SecuritySessionUtils.hentSaksbehandlerId();
            return bidragOrganisasjonApi.saksbehandler.hentSaksbehandlerEnheter(saksbehandlerId);
        },
    });
};
