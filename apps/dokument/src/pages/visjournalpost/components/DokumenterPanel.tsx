import { BodyShort, Heading } from "@navikt/ds-react";
import React, { useEffect, useRef } from "react";

import DokumentView from "../../../common/components/dokument/DokumentView";
import JournalpostKilde from "../../../common/components/dokument/JournalpostKilde";
import SimpleTextField from "../../../common/components/fields/SimpleTextField";
import useRegisterField from "../../../common/components/form/hooks/useRegisterField";
import { isEmpty } from "../../../common/utils/ObjectUtils";
import { useHentJournalpost } from "../../../hooks/useDokumentApi";
import type { Dokument } from "../../../types/journalpost";
import { type UpdateJournalpostFormValues, useVisJournalpostContext } from "../context/VisJournalpostProvider";

export default function DokumenterPanel() {
    const journalpost = useHentJournalpost();
    const dokumenter = journalpost.dokumenter ?? [];
    return (
        <div className="dokumenter-panel" id={"dokumenter-panel"}>
            <Heading size="medium">Dokument(er)</Heading>
            <BodyShort size="small" className={"dokumenter-panel-content"}>
                <JournalpostKilde journalpost={journalpost} />
                <div className={"journalpost-kilde"}>
                    <SimpleTextField label={"Arkivsystem"} value={journalpost.isJoarkJournalpost ? "Joark" : "Bisys"} />
                </div>
                {dokumenter.map((dokument) => (
                    <VisDokument
                        key={dokument.dokumentreferanse}
                        dokument={dokument}
                        journalpostId={journalpost.journalpostId}
                        titleEditable={
                            journalpost.isTemaBidrag && (journalpost.isJoarkJournalpost || journalpost.isForsendelse)
                        }
                    />
                ))}
            </BodyShort>
        </div>
    );
}

interface VisDokumentProps {
    dokument: Dokument;
    journalpostId: string;
    titleEditable: boolean;
}
function VisDokument({ dokument, journalpostId, titleEditable }: VisDokumentProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const { isEditMode } = useVisJournalpostContext();
    const inEditMode = titleEditable && isEditMode;
    const { error, onUpdate } = useRegisterField<UpdateJournalpostFormValues>(
        `endreDokumenter.${dokument.dokumentOrder}` as const,
        {
            required: `Tittel på ${
                dokument.dokumentOrder === 0 ? "hoveddokument" : `vedlegg ${dokument.dokumentOrder}`
            } må settes`,
        },
        () => divRef.current,
        {
            enabled: inEditMode,
        },
    );

    useEffect(() => {
        if (dokument.tittel && inEditMode) {
            onDokumentUpdated(dokument.tittel);
        }
    }, [dokument, inEditMode]);

    function onDokumentUpdated(value: string) {
        if (isEmpty(value)) {
            onUpdate(undefined);
            return;
        }
        onUpdate({ tittel: value, dokId: dokument.dokumentreferanse });
    }

    return (
        <div ref={divRef}>
            <DokumentView
                dokument={dokument}
                editable={inEditMode}
                onChange={onDokumentUpdated}
                journalpostId={journalpostId}
                error={error?.message}
            />
        </div>
    );
}
