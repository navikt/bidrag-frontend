import environment from "../../environment";
import { getParamFromUrl } from "./WindowUtils";

export function getSessionStateFromParam() {
    const sessionState = getParamFromUrl("sessionState");
    return sessionState ? `sessionState=${getParamFromUrl("sessionState")}` : "";
}

export const RedirectTo = {
    oppgaveListe: () => {
        window.location.href = `${environment.url.bisys}Oppgaveliste.do?${getSessionStateFromParam()}`;
    },
    behandleSak: (saksnr: string, openInNewTab?: boolean) => {
        const url = `${environment.url.bisys}Sak.do?saksnr=${saksnr}&${getSessionStateFromParam()}`;
        if (openInNewTab) {
            window.open(url, "_blank").focus();
        } else {
            window.location.href = url;
        }
    },

    sakshistorikk: (saksnr: string) => {
        window.location.href = `${
            environment.url.bisys
        }Sakshistorikk.do?saksnr=${saksnr}&${getSessionStateFromParam()}`;
    },
    joarkJournalpostId: (journalpostId: string, joarkJournalpostId: string) => {
        const currentUrl = window.location.href.replace(journalpostId, joarkJournalpostId);
        window.location.href = currentUrl;
    },
};
