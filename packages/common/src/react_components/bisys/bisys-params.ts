const SESSION_STATE_KEY = "bisys.sessionState";
const ENHET_KEY = "bisys.enhet";

const sessionStateFromUrl = (searchParams: URLSearchParams) => {
    return searchParams.get("sessionState");
};

const enhetFromUrl = (searchParams: URLSearchParams) => {
    return searchParams.get("enhet");
};

/** `sessionStorage` finnes kun i nettleseren - `null` under SSR (og i tester/Node). */
const getSessionStorage = () => (typeof window !== "undefined" ? window.sessionStorage : null);

export function persistBisysParams(url: URL): void {
    const storage = getSessionStorage();
    if (!storage) return;

    const searchParams = url.searchParams;
    const sessionState = sessionStateFromUrl(searchParams);
    const enhet = enhetFromUrl(searchParams);
    if (sessionState) storage.setItem(SESSION_STATE_KEY, sessionState);
    if (enhet) storage.setItem(ENHET_KEY, enhet);
}
/** Parametere som trengs for å kunne beholde tilstand i bisys ved tilbakelinking */
export function getBisysSessionParams(searchParams: URLSearchParams) {
    const storage = getSessionStorage();
    return {
        sessionState: sessionStateFromUrl(searchParams) ?? storage?.getItem(SESSION_STATE_KEY) ?? null,
        enhet: enhetFromUrl(searchParams) ?? storage?.getItem(ENHET_KEY) ?? null,
    };
}
