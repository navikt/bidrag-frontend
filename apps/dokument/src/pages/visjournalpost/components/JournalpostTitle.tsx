import "./JournalpostTitle.css";

import { Heading } from "@navikt/ds-react";
import React, { useRef } from "react";

import EndreDokumentTittel from "../../../common/components/dokument/EndreDokumentTittel";
import useRegisterField from "../../../common/components/form/hooks/useRegisterField";
import { useHentJournalpost } from "../../../hooks/useDokumentApi";
import { JOURNALPOST_TITLE_MAX_LENGTH } from "../../../types/journalpost";
import { type UpdateJournalpostFormValues, useVisJournalpostContext } from "../context/VisJournalpostProvider";

export default function JournalpostTitle() {
    const journalpost = useHentJournalpost();
    const { isEditMode } = useVisJournalpostContext();
    const ref = useRef<HTMLDivElement>(null);

    const { error, onUpdate } = useRegisterField<UpdateJournalpostFormValues>(
        "tittel",
        { required: "Tittel kan ikke være tom", validate },
        () => ref.current.querySelector("input"),
        {
            enabled: isEditable(),
            initialValue: journalpost.innhold,
        },
    );

    function isEditable() {
        return isEditMode && !(journalpost.isJoarkJournalpost || journalpost.isForsendelse);
    }

    function validate(value?: string) {
        if (!value) {
            return false;
        }
        return value.length >= JOURNALPOST_TITLE_MAX_LENGTH
            ? `Tittel kan ikke være lengre enn ${JOURNALPOST_TITLE_MAX_LENGTH} tegn`
            : undefined;
    }

    return (
        <div className="journalpost-title">
            {!isEditable() ? (
                <Heading size="xlarge" id={"journalpost-title"}>
                    {journalpost.innhold}
                </Heading>
            ) : (
                <EndreDokumentTittel
                    defaultValue={journalpost.innhold}
                    onTitleChange={onUpdate}
                    error={error?.message}
                    containerRef={ref}
                />
            )}
        </div>
    );
}
