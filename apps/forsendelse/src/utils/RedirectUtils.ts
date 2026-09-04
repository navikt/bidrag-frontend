import environment from "../environment";

export function getSessionStateFromParam() {
    const sessionState = getParamFromUrl("sessionState");
    return sessionState ? `sessionState=${sessionState}` : "";
}

export const RedirectTo = {
    oppgaveListe: () => {
        window.location.href = withParams(environment.url.bisysOppgaveliste);
    },
    behandleSak: (saksnr: string, openInNewTab?: boolean) => {
        const url = withParams(environment.url.bisysSak, `saksnr=${saksnr}`);
        if (openInNewTab) {
            window.open(url, "_blank")?.focus();
        } else {
            window.location.href = url;
        }
    },
    sakshistorikk: (saksnr: string) => {
        window.location.href = withParams(environment.url.bisysSakshistorikk, `saksnr=${saksnr}`);
    },
    joarkJournalpostId: (journalpostId: string, joarkJournalpostId: string) => {
        window.location.href = window.location.href.replace(journalpostId, joarkJournalpostId);
    },
};

function withParams(path: string, ...extra: string[]) {
    const params = [...extra, getSessionStateFromParam()].filter(Boolean).join("&");
    return params ? `${path}?${params}` : path;
}

function getParamFromUrl(paramKey: string) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramKey);
}
