import {
    Broadcast,
    type BroadcastMessage,
    BroadcastNames,
    type EditDocumentBroadcastMessage,
} from "@navikt/bidrag-ui-common";
import { Edit, ExternalLink } from "@navikt/ds-icons";
import { Button, Link } from "@navikt/ds-react";
import React, { type PropsWithChildren, useState } from "react";
import { v4 as uuidV4 } from "uuid";

import { OpenDocumentUtils } from "../../../pages/opendocument/OpenDocumentUtils";
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

async function editDocument(
    journalpostId: string,
    editedDocument?: EditDocumentBroadcastMessage,
    dokument?: Dokument,
    dokumentList?: Dokument[],
) {
    const windowId = uuidV4();
    if (dokumentList && dokumentList.length > 0) {
        const dokumenter = dokumenterToString(journalpostId, dokumentList);
        OpenDocumentUtils.openDocumentEditorWithDocuments(dokumenter, editedDocument, windowId);
    } else {
        OpenDocumentUtils.openDocumentEditor(journalpostId, dokument.dokumentreferanse, editedDocument);
    }

    return waitForDocumentEditFinished(windowId).then((res) => res.payload);
}

function waitForDocumentEditFinished(id: string): Promise<BroadcastMessage<EditDocumentBroadcastMessage>> {
    return Broadcast.waitForBroadcast(BroadcastNames.EDIT_DOCUMENT_RESULT, id);
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
        onEditStarted();
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
                icon={<Edit fr="true" />}
                size={"small"}
                type={"button"}
            >
                {children ? children : "Rediger"}
            </Button>
            {isWaiting && (
                <Button
                    variant="secondary"
                    onClick={() => {
                        onEditFinished();
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
        onEditStarted();
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
