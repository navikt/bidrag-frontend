import React, { useEffect, useRef } from "react";

import EndreDokumentTittel from "../../../../common/components/dokument/EndreDokumentTittel";
import OpenDocumentButton from "../../../../common/components/dokument/OpenDocumentButton";
import useRegisterField from "../../../../common/components/form/hooks/useRegisterField";
import { isEmpty } from "../../../../common/utils/ObjectUtils";
import { type Dokument, JOURNALPOST_TITLE_MAX_LENGTH } from "../../../../types/journalpost";
import type { JournalpostToRegister } from "../types/JournalpostToRegister";

interface EditDocumentProps {
    index: number;
    label: string;
    dokument: Dokument;
    journalpostId: string;
}

export default function RedigerDokumentInput({ index, label, journalpostId, dokument }: EditDocumentProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const { error, onUpdate } = useRegisterField<JournalpostToRegister>(
        `endreDokumenter.${index}` as const,
        {
            required: `Tittel på ${index === 0 ? "hoveddokument" : `vedlegg ${index}`} må settes`,
            validate: validate,
        },
        () => divRef.current,
    );

    useEffect(() => {
        if (dokument.tittel) {
            onDokChange(dokument.tittel);
        }
    }, []);

    function validate(value?: Dokument) {
        if (!value) {
            return false;
        }
        if (!journalpostId.startsWith("BID")) return true;
        return value.tittel.length >= JOURNALPOST_TITLE_MAX_LENGTH
            ? `Tittel kan ikke være lengre enn ${JOURNALPOST_TITLE_MAX_LENGTH} tegn`
            : undefined;
    }

    function onDokChange(tittel: string) {
        if (isEmpty(tittel)) {
            onUpdate(undefined);
            return;
        }
        onUpdate({ dokId: dokument.dokumentreferanse, tittel });
    }

    return (
        <div ref={divRef} className={"edit-document-input"} id={`doc_${dokument.dokumentreferanse}`}>
            <EndreDokumentTittel
                defaultValue={dokument.tittel}
                onTitleChange={onDokChange}
                error={error?.message}
                label={label}
            />
            <OpenDocumentButton
                journalpostId={dokument.journalpostId ?? journalpostId}
                dokumentreferanse={dokument.dokumentreferanse}
                status={dokument.status}
            />
        </div>
    );
}
