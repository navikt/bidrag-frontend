import type { EnhetDto } from "@bidrag/api/OrganisasjonApi";
import { SecuritySessionUtils } from "@bidrag/common";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BIDRAG_ORGANISASJON_API } from "../api/api";

export const OrganisasjonQueryKeys = {
    organisasjon: "organisasjon",
    hentEnhet: (enhetId: string) => [OrganisasjonQueryKeys.organisasjon, "hentEnhet", enhetId],
    useHentJournalforendeEnheter: () => [OrganisasjonQueryKeys.organisasjon, "hentJournalforendeEnheter"],
    useHentSaksbehandlerEnhetsliste: () => [OrganisasjonQueryKeys.organisasjon, "hentSaksbehandlerEnhetliste"],
    hentEnhetsliste: () => [OrganisasjonQueryKeys.organisasjon, "hentEnhetsliste"],
};

export const useHentSaksbehandlerEnhetsliste = () => {
    return useSuspenseQuery({
        queryKey: OrganisasjonQueryKeys.useHentSaksbehandlerEnhetsliste(),
        queryFn: async () => {
            const saksbehandlerId = await SecuritySessionUtils.hentSaksbehandlerId();
            return BIDRAG_ORGANISASJON_API.saksbehandler.hentSaksbehandlerEnheter(saksbehandlerId);
        },
    }).data.data;
};
export const useHentJournalforendeEnheter = () => {
    return useSuspenseQuery({
        queryKey: OrganisasjonQueryKeys.useHentJournalforendeEnheter(),
        queryFn: () => BIDRAG_ORGANISASJON_API.arbeidsfordeling.hentArbeidsfordelingJournalforendeEnheter(),
    }).data.data;
};

export const useHentEnhetsliste = () => {
    return useSuspenseQuery({
        queryKey: OrganisasjonQueryKeys.hentEnhetsliste(),
        queryFn: () => BIDRAG_ORGANISASJON_API.arbeidsfordeling.hentArbeidsfordelingJournalforendeEnheter(),
    }).data;
};

export const useHentEnhet = (enhetId: string) => {
    return useSuspenseQuery({
        ...OrganisasjonQueryFunctions.hentEnhet(enhetId),
    }).data;
};
export const OrganisasjonQueryFunctions = {
    hentEnhet: (enhetId: string) => ({
        queryKey: OrganisasjonQueryKeys.hentEnhet(enhetId),
        queryFn: ({ queryKey }) => {
            const enhetId = queryKey[2];
            if (enhetId === undefined) {
                return { nummer: enhetId, enhetIdent: enhetId, enhetNavn: "Ukjent", status: "NEDLAGT" } as EnhetDto;
            }
            return BIDRAG_ORGANISASJON_API.enhet.hentEnhetInfo(queryKey[2]).then((response) => response.data);
        },
    }),
};
