const SESSION_STATE_KEY = "bisys.sessionState";
const ENHET_KEY = "bisys.enhet";

const sessionStateFromUrl = (searchParams: URLSearchParams) => {
    return  searchParams.get("sessionState");
}

const enhetFromUrl = (searchParams: URLSearchParams) => {
    return searchParams.get("enhet");
}

export function persistBisysParams(url: URL): void {
    const searchParams = url.searchParams;
    const sessionState = sessionStateFromUrl(searchParams);
    const enhet = enhetFromUrl(searchParams);
    if (sessionState) sessionStorage.setItem(SESSION_STATE_KEY, sessionState);
    if (enhet) sessionStorage.setItem(ENHET_KEY, enhet);
}
/** Parametere som trengs for å kunne beholde tilstand i bisys ved tilbakelinking */
export function getBisysSessionParams(searchParams: URLSearchParams) {
    return {
        sessionState: sessionStateFromUrl(searchParams) ?? sessionStorage.getItem(SESSION_STATE_KEY),
        enhet: enhetFromUrl(searchParams) ?? sessionStorage.getItem(ENHET_KEY),
    };
}
