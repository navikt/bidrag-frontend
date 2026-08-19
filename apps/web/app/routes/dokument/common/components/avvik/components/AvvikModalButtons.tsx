import { Button, Modal } from "@navikt/ds-react";
import React from "react";

import { useJournalpost } from "../../../../store/JournalpostContext";
import { useAvvikModalContext } from "./AvvikshandteringModal";

interface AvvikModalButtonsProps {
    onSubmit?: (e) => void;
    disabled?: boolean;
    loading?: boolean;
    submitButtonLabel?: string;
}
export default function AvvikModalButtons({
    onSubmit,
    submitButtonLabel = "Neste",
    disabled,
    loading,
}: AvvikModalButtonsProps) {
    const { onCancel } = useAvvikModalContext();
    const { avvikState } = useJournalpost();
    return (
        <Modal.Footer className="!pb-0 mb-0">
            <Button
                variant={"primary"}
                size="xsmall"
                onClick={onSubmit}
                id={"avvik-confirm-button"}
                disabled={disabled || avvikState == "pending"}
                loading={loading || avvikState == "pending"}
            >
                {submitButtonLabel}
            </Button>
            <Button size="xsmall" variant={"tertiary"} type="button" onClick={onCancel} id={"avvik-cancel-button"}>
                Forkast
            </Button>
        </Modal.Footer>
    );
}
