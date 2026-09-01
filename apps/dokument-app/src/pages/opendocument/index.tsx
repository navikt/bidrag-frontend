import React from "react";

import OpenDocument from "./OpenDocument";

interface OpenDocumentPageProps {
    journalpostId: string;
    dokumenter?: string[];
    dokumentreferanse: string;
    closeTabAfterOpen?: boolean;
    openInNewTab?: boolean;
    openInBrowser: boolean;
    resizeToA4: boolean;
    optimizeForPrint: boolean;
}

export default function OpenDocumentPage({
    journalpostId,
    dokumenter,
    dokumentreferanse,
    closeTabAfterOpen,
    openInNewTab,
    resizeToA4,
    optimizeForPrint,
    openInBrowser,
}: OpenDocumentPageProps) {
    return (
        <OpenDocument
            dokumenter={dokumenter}
            closeTabAfterOpen={closeTabAfterOpen}
            journalpostId={journalpostId}
            dokumentreferanse={dokumentreferanse}
            openInNewTab={openInNewTab}
            resizeToA4={resizeToA4}
            optimizeForPrint={optimizeForPrint}
            open
            openInBrowser={openInBrowser}
        />
    );
}
