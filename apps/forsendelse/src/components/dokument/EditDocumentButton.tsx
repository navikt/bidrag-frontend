import {
    Broadcast,
    type BroadcastMessage,
    BroadcastNames,
    type EditDocumentBroadcastMessage,
    EditorConfigStorage,
    LoggerService,
    OpenDocumentUtils,
} from "@bidrag/common";
import { XMarkIcon as Close, ExternalLinkIcon as ExternalLink } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { type PropsWithChildren, useState } from "react";
import { v4 as uuidV4 } from "uuid";

import type { IDokument } from "../../types/Dokument";

interface EditDocumentButtonProps {
    dokumentList?: IDokument[];
    journalpostId: string;
    dokumentreferanse?: string;
    erSkjema?: boolean;
    editedDocument?: EditDocumentBroadcastMessage;
    onEditFinished: (document?: EditDocumentBroadcastMessage) => void;
    onEditStarted?: () => void;
}

function openDocumentSkjemaEditor(forsendelseId, dokumentreferanse, editedDocument, id) {
    LoggerService.info(
        `Åpner skjemaredigering av forsendelse ${forsendelseId} og dokument ${dokumentreferanse} på nettleser`,
    );
    if (id && editedDocument) {
        EditorConfigStorage.save(id, editedDocument?.config);
    }
    window.open(`/rediger/skjemautfylling/${forsendelseId}/${dokumentreferanse}?id=${id}`);
}
async function editDocument(
    journalpostId: string,
    dokumentreferanse: string,
    erSkjema?: boolean,
    editedDocument?: EditDocumentBroadcastMessage,
) {
    const windowId = uuidV4();
    if (erSkjema) {
        openDocumentSkjemaEditor(journalpostId, dokumentreferanse, editedDocument, windowId);
    } else {
        OpenDocumentUtils.openDocumentMaskingEditor(journalpostId, dokumentreferanse, editedDocument, windowId);
    }

    return waitForDocumentEditFinished(windowId).then((res) => res.payload);
}

function waitForDocumentEditFinished(id: string): Promise<BroadcastMessage<EditDocumentBroadcastMessage>> {
    return Broadcast.waitForBroadcast(BroadcastNames.EDIT_DOCUMENT_RESULT, id);
}

export default function EditDocumentButton({
    journalpostId,
    dokumentreferanse,
    editedDocument,
    onEditFinished,
    erSkjema,
    onEditStarted,
}: PropsWithChildren<EditDocumentButtonProps>) {
    const [isWaiting, setIsWaiting] = useState(false);
    function _editDocument() {
        onEditStarted?.();
        setIsWaiting(true);
        editDocument(journalpostId, dokumentreferanse, erSkjema, editedDocument)
            .then(onEditFinished)
            .finally(() => setIsWaiting(false));
    }

    return (
        <div className={"flex flex-row gap-2"}>
            <Button
                loading={isWaiting}
                variant="tertiary"
                onClick={_editDocument}
                icon={<ExternalLink fr="true" />}
                size={"small"}
                type={"button"}
            />
            {isWaiting && (
                <Button
                    variant="secondary"
                    onClick={() => {
                        onEditFinished();
                        setIsWaiting(false);
                    }}
                    icon={<Close fr="true" />}
                    size={"small"}
                    type={"button"}
                />
            )}
        </div>
    );
}
