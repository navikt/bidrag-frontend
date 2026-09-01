import { useEffect, useState } from "react";

import DokumentService from "../../../services/DokumentService";
import type { DokumentMetadata } from "../../../types/api/DokumentTypes";
import AapneDokumentKnapp from "./AapneDokumentKnappWrapper";

interface OpenDocumentButtonProps {
    dokumentreferanse?: string;
    journalpostId?: string;
    status?: string;
    openInBrowser?: boolean;
    documentByte?: ArrayBuffer | string;
}

export default function OpenDocumentButton({
    journalpostId,
    dokumentreferanse,
    documentByte,
    openInBrowser: openInBrowserProp,
}: OpenDocumentButtonProps) {
    // Delegate rendering and opening behavior to shared AapneDokumentKnapp from @bidrag/common.
    // We still keep fetching metadata for tests and possible conditional logic (mbdok) below.
    const [metadata, setMetadata] = useState<DokumentMetadata[]>([]);

    useEffect(() => {
        if (!journalpostId) {
            setMetadata([]);
            return;
        }
        new DokumentService()
            .getDokumentMetadata(journalpostId, dokumentreferanse ?? "")
            .then((metadata) => setMetadata(metadata));
    }, [journalpostId, dokumentreferanse]);

    // If special MBDOK case needs a direct link, preserve that behavior.
    if (metadata.length === 1 && metadata[0].status === "UNDER_REDIGERING" && metadata[0].format === "MBDOK") {
        return <MbdokUrl journalpostId={journalpostId} dokumentreferanse={dokumentreferanse} />;
    }

    return (
        <AapneDokumentKnapp
            journalpostId={journalpostId}
            dokumentreferanse={dokumentreferanse}
            documentByte={documentByte}
            openInBrowser={openInBrowserProp}
        />
    );
}
function MbdokUrl({ dokumentreferanse, journalpostId }: { dokumentreferanse?: string; journalpostId?: string }) {
    const [doklink, setDoklink] = useState<string | undefined>(undefined);

    useEffect(() => {
        let mounted = true;
        if (!dokumentreferanse && !journalpostId) return;
        new DokumentService()
            .getDokumentUrl(dokumentreferanse, journalpostId)
            .then((doklink) => mounted && setDoklink(doklink))
            .catch(() => mounted && setDoklink(undefined));
        return () => {
            mounted = false;
        };
    }, [dokumentreferanse, journalpostId]);

    return (
        <a
            style={{ scale: 1.5, margin: "auto 0", display: "inline-flex", alignItems: "center", gap: 6 }}
            href={doklink}
            aria-label="Åpne MBDOK-dokument"
        >
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
            <span>Åpne</span>
        </a>
    );
}
