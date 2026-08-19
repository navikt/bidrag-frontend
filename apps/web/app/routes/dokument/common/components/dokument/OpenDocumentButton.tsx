import type React from "react";
import { useEffect, useState } from "react";

import { OpenDocumentUtils } from "../../../pages/opendocument/OpenDocumentUtils";
import DokumentService from "../../../services/DokumentService";
import type { DokumentMetadata } from "../../../types/api/DokumentTypes";
import ExternalLink from "../icons/ExternalLink";

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
    const [metadata, setMetadata] = useState<DokumentMetadata[]>([]);

    useEffect(() => {
        new DokumentService()
            .getDokumentMetadata(journalpostId, dokumentreferanse)
            .then((metadata) => setMetadata(metadata));
    }, []);

    const onClick = (e: React.MouseEvent) => {
        const openInBrowser = openInBrowserProp ?? e.shiftKey ?? false;
        OpenDocumentUtils.openDocument({
            journalpostId,
            dokumentreferanse,
            documentByte,
            openInBrowser,
            openInNewTab: true,
            resizeToA4: openInBrowser,
        });
    };

    // if (metadata.length === 1 && metadata[0].status === "UNDER_REDIGERING" && metadata[0].format == "MBDOK") {
    //     return <MbdokUrl journalpostId={journalpostId} dokumentreferanse={dokumentreferanse} />;
    // }

    return (
        <div className={"hover:cursor-pointer pl-1 pt-1 view-document-button"} onClick={onClick}>
            <ExternalLink />
        </div>
    );
}
function MbdokUrl({ dokumentreferanse, journalpostId }) {
    const [doklink, setDoklink] = useState<string>();

    useEffect(() => {
        new DokumentService().getDokumentUrl(dokumentreferanse, journalpostId).then((doklink) => setDoklink(doklink));
    }, []);

    return (
        <a style={{ scale: 1.5, margin: "auto 0" }} href={doklink}>
            <ExternalLink />
        </a>
    );
}
