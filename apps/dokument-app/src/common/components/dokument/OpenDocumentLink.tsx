import { ExternalLink } from "@navikt/ds-icons";
import { Link } from "@navikt/ds-react";
import React, { type PropsWithChildren } from "react";

import { OpenDocumentUtils } from "../../../pages/opendocument/OpenDocumentUtils";
import { type Dokument, dokumenterToString } from "../../../types/journalpost";
import DokumentLabel from "./DokumentLabel";

interface BaseOpenDocumentLinkProps {
    dokument?: Dokument;
    dokumentList?: Dokument[];
    journalpostId?: string;
    documentByte?: ArrayBuffer | string;
    openInBrowser?: boolean;
    resizeToA4?: boolean;
}

interface OpenByteArrayDocumentLinkProps extends BaseOpenDocumentLinkProps {
    journalpostId?: never;
    documentByte: ArrayBuffer | string;
    dokumentList?: never;
}

interface OpenSingleDocumentLinkProps extends BaseOpenDocumentLinkProps {
    journalpostId: string;
    dokument: Dokument;
    dokumentList?: never;
}

interface OpenMultipleDocumentsLinkProps extends BaseOpenDocumentLinkProps {
    journalpostId: string;
    dokument?: never;
    dokumentList: Dokument[];
}

type OpenDocumentLinkProps =
    | OpenMultipleDocumentsLinkProps
    | OpenSingleDocumentLinkProps
    | OpenByteArrayDocumentLinkProps;

export default function OpenDocumentLink({
    dokument,
    journalpostId,
    openInBrowser,
    children,
    resizeToA4,
    documentByte,
    dokumentList,
}: PropsWithChildren<OpenDocumentLinkProps>) {
    const onClick = () => {
        OpenDocumentUtils.openDocument({
            journalpostId,
            dokumentreferanse: dokument?.dokumentreferanse,
            dokumenter: dokumenterToString(journalpostId, dokumentList),
            documentByte,
            openInBrowser,
            openInNewTab: true,
            resizeToA4,
        });
    };

    return (
        <Link onClick={onClick} href={"#"}>
            {children ? children : <DokumentLabel dokument={dokument} />}
            {/* @ts-ignore */}
            <ExternalLink />
        </Link>
    );
}
