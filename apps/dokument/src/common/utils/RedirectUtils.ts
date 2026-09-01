import environment from "../../environment";
import { getParamFromUrl } from "./WindowUtils";

export function getSessionStateFromParam() {
    const sessionState = getParamFromUrl("sessionState");
    return sessionState ? `sessionState=${getParamFromUrl("sessionState")}` : "";
}

export const RedirectTo = {
    oppgaveListe: () => {
        window.location.href = environment.url.bisys("oppgaveliste", {
            sessionState: getParamFromUrl("sessionState") ?? "",
        });
    },
    behandleSak: (saksnr: string, openInNewTab?: boolean) => {
        const url = environment.url.bisys("sak", { saksnr, sessionState: getParamFromUrl("sessionState") ?? "" });
        if (openInNewTab) {
            window.open(url, "_blank").focus();
        } else {
            window.location.href = url;
        }
    },

    sakshistorikk: (saksnr: string) => {
        window.location.href = environment.url.bisys("sakshistorikk", {
            saksnr,
            sessionState: getParamFromUrl("sessionState") ?? "",
        });
    },
    joarkJournalpostId: (journalpostId: string, joarkJournalpostId: string) => {
        const currentUrl = window.location.href.replace(journalpostId, joarkJournalpostId);
        window.location.href = currentUrl;
    },
};
