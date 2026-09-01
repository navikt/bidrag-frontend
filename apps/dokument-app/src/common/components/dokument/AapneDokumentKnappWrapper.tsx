import type { MouseEvent } from "react";
import { OpenDocumentUtils } from "../../../pages/opendocument/OpenDocumentUtils";

interface Props {
    journalpostId?: string;
    dokumentreferanse?: string;
    documentByte?: ArrayBuffer | string;
    openInBrowser?: boolean;
}

export default function AapneDokumentKnappWrapper({
    journalpostId,
    dokumentreferanse,
    documentByte,
    openInBrowser,
}: Props) {
    const onClick = (e: MouseEvent) => {
        const openInBrowserFlag = openInBrowser ?? e.shiftKey ?? false;

        // Require at least a journalpostId or a document byte or a dokumentreferanse
        if (!journalpostId && !documentByte && !dokumentreferanse) {
            // Nothing to open
            console.warn("Ingen dokumentreferanse eller journalpostId oppgitt");
            return;
        }

        OpenDocumentUtils.openDocument({
            journalpostId: journalpostId ?? "",
            dokumentreferanse,
            documentByte,
            openInNewTab: true,
            openInBrowser: openInBrowserFlag,
            resizeToA4: openInBrowserFlag,
        }).catch((e) => window.alert(e?.message ?? "Kunne ikke åpne dokument"));
    };

    return (
        <button
            type="button"
            aria-label="Åpne dokument"
            className="hover:cursor-pointer pl-1 pt-1 view-document-button"
            onClick={onClick}
        >
            {/* simple inline icon to avoid an extra dependency here */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <title>Åpne dokument</title>
                <path
                    d="M14 3H21V10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M10 14L21 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M21 21H3V3H12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <span style={{ marginLeft: 6 }}>Åpne</span>
        </button>
    );
}
