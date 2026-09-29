import { getBisysSessionParams } from "../react_components/bisys/bisys-params";

export function getSessionStateFromParam() {
    const sessionState = getParamFromUrl("sessionState") ?? sessionStorage.getItem(`bisys.sessionState`);
    return sessionState ? `sessionState=${getParamFromUrl("sessionState")}` : "";
}

export const RedirectTo = {
    oppgaveListe: (bisysurl: string) => {
        window.location.href = `${bisysurl}Oppgaveliste.do?${getSessionStateFromParam()}`;
    },
    behandleSak: (saksnr: string, bisysurl: string, openInNewTab?: boolean) => {
        const url = `${bisysurl}Sak.do?saksnr=${saksnr}&${getSessionStateFromParam()}`;
        if (openInNewTab) {
            window.open(url, "_blank")?.focus();
        } else {
            window.location.href = url;
        }
    },

    nySoknad(saksnr: string, bisysurl: string) {
        window.location.href = `${bisysurl}Soknad.do?saksnr=${saksnr}&${getSessionStateFromParam()}`;
    },
    soknad(saksnr: string, søknadsid: string, bisysurl: string) {
        window.location.href = `${bisysurl}Soknad.do?saksnr=${saksnr}&hentSoknadsnr=${søknadsid}&${getSessionStateFromParam()}`;
    },

    /** Går til sakshistorikk i Bisys når brukeren kom derfra (`?from=bisys`), ellers til sakshistorikken i denne appen. */
    sakshistorikk: (saksnr: string) => {
        const searchParams = new URLSearchParams(window.location.search);
        const { sessionState } = getBisysSessionParams(searchParams);
        const params = new URLSearchParams();
        if (searchParams.get("from") === "bisys") {
            params.set("saksnr", saksnr);
            if (sessionState) params.set("sessionState", sessionState);
            window.location.href = `/bisys/sakshistorikk?${params}`;
            return;
        }
        if (sessionState) params.set("sessionState", sessionState);
        const query = params.toString();
        window.location.href = `/sak/${saksnr}/sakshistorikk${query ? `?${query}` : ""}`;
    },

    joarkJournalpostId: (journalpostId: string, joarkJournalpostId: string) => {
        const currentUrl = window.location.href.replace(journalpostId, joarkJournalpostId);
        window.location.href = currentUrl;
    },
};

function getParamFromUrl(paramKey: string) {
    const queryParams = window.location.search;
    const urlParams = new URLSearchParams(queryParams);
    return urlParams.get(paramKey);
}
