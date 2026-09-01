import {
    Broadcast,
    type BroadcastMessage,
    BroadcastNames,
    type EditDocumentBroadcastMessage,
    EditorConfigStorage,
    LoggerService,
} from "@bidrag/common";
import { PencilIcon as Edit, ExternalLinkIcon as ExternalLink } from "@navikt/aksel-icons";
import { Button, Link } from "@navikt/ds-react";
import React, { type PropsWithChildren, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { z } from "zod";

import { type Dokument, dokumenterToString } from "../../../types/journalpost";
import DokumentLabel from "./DokumentLabel";

interface BaseOpenDocumentLinkProps {
    isLink?: boolean;
    dokument?: Dokument;
    dokumentList?: Dokument[];
    journalpostId: string;
    editedDocument?: EditDocumentBroadcastMessage;
    onEditFinished: (document?: EditDocumentBroadcastMessage) => void;
    onEditStarted?: () => void;
}
interface EditSingleDocumentButtonProps extends BaseOpenDocumentLinkProps {
    dokument: Dokument;
    dokumentList?: never;
}

interface EditMultipleDocumentsButtonProps extends BaseOpenDocumentLinkProps {
    dokument?: never;
    dokumentList: Dokument[];
}

type EditDocumentButtonProps = EditMultipleDocumentsButtonProps | EditSingleDocumentButtonProps;

/** Åpner dokumentredigeringen (`@bidrag/redigering`) i en ny fane og venter på resultatet via `BroadcastChannel`. */
function openDocumentEditorWithDocuments(
    dokumenter: string[],
    editedDocument?: EditDocumentBroadcastMessage,
    id?: string,
) {
    LoggerService.info(`Åpner dokumenter ${dokumenter} for redigering`);
    const dokumenterPath = dokumenter.map((dokument) => `dokument=${dokument}`).join("&");
    if (id && editedDocument) {
        EditorConfigStorage.save(id, editedDocument.config);
    }
    window.open(`/rediger/?${dokumenterPath}&id=${id}`);
}

function openDocumentEditor(
    journalpostId: string,
    dokumentreferanse?: string,
    editedDocument?: EditDocumentBroadcastMessage,
    id?: string,
) {
    LoggerService.info(`Åpner dokument ${journalpostId}/${dokumentreferanse ?? ""} for redigering`);
    if (id && editedDocument) {
        EditorConfigStorage.save(id, editedDocument.config);
    }
    const dokumentreferansePath = dokumentreferanse ? `/${dokumentreferanse}` : "";
    window.open(`/rediger/${journalpostId}${dokumentreferansePath}?id=${id}`);
}

async function editDocument(
    journalpostId: string,
    editedDocument?: EditDocumentBroadcastMessage,
    dokument?: Dokument,
    dokumentList?: Dokument[],
) {
    const windowId = uuidV4();
    if (dokumentList && dokumentList.length > 0) {
        const dokumenter = dokumenterToString(journalpostId, dokumentList);
        openDocumentEditorWithDocuments(dokumenter, editedDocument, windowId);
    } else {
        openDocumentEditor(journalpostId, dokument.dokumentreferanse, editedDocument, windowId);
    }

    return waitForDocumentEditFinished(windowId).then((res) => res.payload);
}

function waitForDocumentEditFinished(id: string): Promise<BroadcastMessage<EditDocumentBroadcastMessage>> {
    return Broadcast.waitForBroadcast(BroadcastNames.EDIT_DOCUMENT_RESULT, z.any(), id);
}

export default function EditDocumentButton({ isLink, ...props }: PropsWithChildren<EditDocumentButtonProps>) {
    return isLink ? <EditDocumentLink {...props} /> : <_EditDocumentButton {...props} />;
}
function _EditDocumentButton({
    dokument,
    journalpostId,
    children,
    dokumentList,
    editedDocument,
    onEditFinished,
    onEditStarted,
}: PropsWithChildren<EditDocumentButtonProps>) {
    const [isWaiting, setIsWaiting] = useState(false);
    function _editDocument() {
        onEditStarted?.();
        setIsWaiting(true);
        editDocument(journalpostId, editedDocument, dokument, dokumentList)
            .then(onEditFinished)
            .finally(() => setIsWaiting(false));
    }

    return (
        <div className={"flex flex-row gap-2"}>
            <Button
                loading={isWaiting}
                variant="secondary"
                onClick={_editDocument}
                icon={<Edit />}
                size={"small"}
                type={"button"}
            >
                {children ? children : "Rediger"}
            </Button>
            {isWaiting && (
                <Button
                    variant="secondary"
                    onClick={() => {
                        onEditFinished(undefined);
                        setIsWaiting(false);
                    }}
                    size={"small"}
                    type={"button"}
                >
                    {"Avbryt"}
                </Button>
            )}
        </div>
    );
}

function EditDocumentLink({
    dokument,
    journalpostId,
    children,
    dokumentList,
    editedDocument,
    onEditFinished,
    onEditStarted,
}: PropsWithChildren<EditDocumentButtonProps>) {
    const [isWaiting, setIsWaiting] = useState(false);
    function _editDocument() {
        onEditStarted?.();
        setIsWaiting(true);
        editDocument(journalpostId, editedDocument, dokument, dokumentList)
            .then(onEditFinished)
            .finally(() => setIsWaiting(false));
    }

    return (
        <Link onClick={_editDocument} href={"#"}>
            {children ? children : <DokumentLabel dokument={dokument} />}
            {/* @ts-ignore */}
            <ExternalLink />
        </Link>
    );
}
