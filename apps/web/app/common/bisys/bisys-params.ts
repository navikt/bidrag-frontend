const SESSION_STATE_KEY = "bidrag.sessionState";
const ENHET_KEY = "bidrag.enhet";

export function persistBisysParams(url: URL): void {
    const sessionState = url.searchParams.get("sessionState");
    const enhet = url.searchParams.get("enhet");
    if (sessionState) sessionStorage.setItem(SESSION_STATE_KEY, sessionState);
    if (enhet) sessionStorage.setItem(ENHET_KEY, enhet);
}

export function getBisysParams() {
    return {
        sessionState: sessionStorage.getItem(SESSION_STATE_KEY),
        enhet: sessionStorage.getItem(ENHET_KEY),
    };
}
