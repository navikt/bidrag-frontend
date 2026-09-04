import {
    BIDRAG_DOKUMENT_API as BIDRAG_DOKUMENT,
    BIDRAG_DOKUMENT_ARKIV_API as BIDRAG_DOKUMENT_ARKIVERING,
    BIDRAG_KODEVERK_API as BIDRAG_KODEVERK,
    BIDRAG_ORGANISASJON_API as BIDRAG_ORGANISASJON,
    BIDRAG_PERSON_API,
    BIDRAG_SAK_API as BIDRAG_SAK,
    BIDRAG_SAMHANDLER_API,
} from "@bidrag/api";

// Alle backend-kall går via /proxy/<app> i apps/web. Klientene er delte singletoner
// fra @bidrag/api. Navnene beholdes fra den frittstående bidrag-dokument-ui slik at
// kallstedene i sidene ikke måtte endres under migreringen.
export const PERSON_API = BIDRAG_PERSON_API;
export const SAK_API = BIDRAG_SAK;
export const SAMHANDLER_API = BIDRAG_SAMHANDLER_API;
export const BIDRAG_DOKUMENT_API = BIDRAG_DOKUMENT;
export const BIDRAG_ORGANISASJON_API = BIDRAG_ORGANISASJON;
export const BIDRAG_KODEVERK_API = BIDRAG_KODEVERK;
export const BIDRAG_DOKUMENT_ARKIVERING_API = BIDRAG_DOKUMENT_ARKIVERING;
