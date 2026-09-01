import { OpenDocumentUtils } from "./pages/opendocument/OpenDocumentUtils";

type OpenEvent = {
    journalpostId?: string;
    dokumentreferanse?: string;
    documentByte?: ArrayBuffer | string;
    openInBrowser?: boolean;
};

window.addEventListener("bidrag:openDocument", (e: Event) => {
    const ev = e as CustomEvent<OpenEvent>;
    const detail = ev.detail;
    if (!detail) return;
    OpenDocumentUtils.openDocument({
        journalpostId: detail.journalpostId ?? "",
        dokumentreferanse: detail.dokumentreferanse,
        documentByte: detail.documentByte,
        openInNewTab: true,
        openInBrowser: detail.openInBrowser,
        resizeToA4: detail.openInBrowser,
    }).catch((err) => {
        console.warn("Failed to open document from event", err);
    });
});
