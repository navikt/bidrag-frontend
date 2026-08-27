// Alle backend-kall går via /proxy/<app> i apps/web. Klientene er delte
// singletoner fra @bidrag/api.
export { BIDRAG_DOKUMENT_API, BIDRAG_FORSENDELSE_API } from "@bidrag/api";
