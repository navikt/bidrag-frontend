import { BodyLong, Modal } from "@navikt/ds-react";
import React, { forwardRef, type MutableRefObject, type ReactNode } from "react";

export const ConfirmationModal = forwardRef(
    (
        {
            heading,
            description,
            footer,
            closeable = true,
        }: {
            heading: ReactNode;
            description: string;
            footer: ReactNode;
            closeable: boolean;
        },
        ref: MutableRefObject<HTMLDialogElement>,
    ) => {
        return (
            <Modal ref={ref} closeOnBackdropClick={closeable} aria-labelledby="modal-heading">
                <Modal.Header closeButton={closeable}>{heading}</Modal.Header>
                <Modal.Body>
                    <BodyLong size="small">{description}</BodyLong>
                </Modal.Body>
                <Modal.Footer>{footer}</Modal.Footer>
            </Modal>
        );
    },
);
