import React from "react";
import { ExternalLinkIcon } from "@navikt/aksel-icons";

// This component is intentionally presentation-only and does not implement
// document-opening logic. Consumers can pass an `onOpen` handler or rely on a
// DOM CustomEvent (`bidrag:openDocument`) for de-coupled behavior. This avoids
// a circular dependency where `packages/common` imports implementation from
// `apps/dokument-app`.
interface Props {
    journalpostId?: string;
    dokumentreferanse?: string;
    documentByte?: ArrayBuffer | string;
    openInBrowser?: boolean;
    // optional click handler that should perform the actual opening logic
    onOpen?: (args: { journalpostId?: string; dokumentreferanse?: string; documentByte?: ArrayBuffer | string; openInBrowser?: boolean }) => void;
}

export default function AapneDokumentKnapp({ journalpostId, dokumentreferanse, documentByte, openInBrowser, onOpen }: Props) {
    const onClick = (e: React.MouseEvent) => {
        const openInBrowserFlag = openInBrowser ?? e.shiftKey ?? false;
        if (onOpen) {
            onOpen({ journalpostId, dokumentreferanse, documentByte, openInBrowser: openInBrowserFlag });
            return;
        }

        // Fallback: dispatch an event for apps to listen to and handle opening.
        const detail = { journalpostId, dokumentreferanse, documentByte, openInBrowser: openInBrowserFlag };
        window.dispatchEvent(new CustomEvent("bidrag:openDocument", { detail }));
    };

    return (
        <div className="hover:cursor-pointer pl-1 pt-1 view-document-button" onClick={onClick}>
            <ExternalLinkIcon aria-hidden />
        </div>
    );
}

