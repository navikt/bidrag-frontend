import "./DokumentView.less";

import { BodyShort } from "@navikt/ds-react";
import React from "react";

import type { Dokument } from "../../../types/journalpost";
import DokumentLabel from "./DokumentLabel";
import EndreDokumentTittel from "./EndreDokumentTittel";
import OpenDocumentButton from "./OpenDocumentButton";
export interface DokumentProps {
    dokument: Dokument;
    editable?: boolean;
    journalpostId: string;
    onChange?: (value: string) => void;
    error?: string;
}
export default function DokumentView({ onChange, journalpostId, dokument, editable, error }: DokumentProps) {
    return (
        <div className="dokument-item " key={dokument?.dokumentreferanse} id={`doc_${dokument.dokumentreferanse}`}>
            <DokumentTittel editable={editable} dokument={dokument} onChange={onChange} error={error} />
            <OpenDocumentButton
                journalpostId={dokument.journalpostId ?? journalpostId}
                dokumentreferanse={dokument.dokumentreferanse}
                status={dokument.status}
            />
        </div>
    );
}

interface DokumentTittelProps {
    editable: boolean;
    dokument: Dokument;
    onChange?: (value: string) => void;
    error?: string;
}
function DokumentTittel({ error, onChange, editable, dokument }: DokumentTittelProps) {
    function onTitleChange(value: string) {
        onChange?.(value);
    }

    if (editable) {
        return (
            <EndreDokumentTittel
                label={<DokumentLabel dokument={dokument} />}
                defaultValue={dokument.tittel}
                onTitleChange={onTitleChange}
                error={error}
            />
        );
    }

    return (
        <BodyShort as="div" size="small" className="self-end">
            <DokumentLabel dokument={dokument} />
        </BodyShort>
    );
}
