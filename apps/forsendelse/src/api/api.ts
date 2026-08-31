import {
    BIDRAG_DOKUMENT_API,
    BIDRAG_DOKUMENT_ARKIV_API,
    BIDRAG_FORSENDELSE_API,
    BIDRAG_KODEVERK_API,
    BIDRAG_ORGANISASJON_API,
    BIDRAG_PERSON_API,
    BIDRAG_SAK_API,
    BIDRAG_SAMHANDLER_API,
    BIDRAG_TILGANGSKONTROLL_API,
} from "@bidrag/api";

// Alle backend-kall går via /proxy/<app> i apps/web. Klientene er delte
// singletoner fra @bidrag/api. Hookene beholdes for å unngå endringer i
// kallssteder som ble migrert fra den frittstående forsendelse-appen.
export const useSamhandlerApi = () => BIDRAG_SAMHANDLER_API;
export const usePersonApi = () => BIDRAG_PERSON_API;
export const useSakApi = () => BIDRAG_SAK_API;
export const useBidragDokumentApi = () => BIDRAG_DOKUMENT_API;
export const useBidragOrganisasjonApi = () => BIDRAG_ORGANISASJON_API;
export const useBidragForsendelseApi = () => BIDRAG_FORSENDELSE_API;
export const useBidragTilgangskontrollApi = () => BIDRAG_TILGANGSKONTROLL_API;
export const useBidragDokumentArkivApi = () => BIDRAG_DOKUMENT_ARKIV_API;
export const useBidragKodeverkApi = () => BIDRAG_KODEVERK_API;
