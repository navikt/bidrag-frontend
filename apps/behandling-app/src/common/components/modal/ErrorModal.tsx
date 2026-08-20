import "./errorModal.css";

import { XMarkOctagonFillIcon } from "@navikt/aksel-icons";
import { BodyLong, Heading, Modal } from "@navikt/ds-react";
import React, { useEffect } from "react";
import { useBehandlingProvider } from "../../context/BehandlingContext";

export const ErrorModal = () => {
    const { errorMessage, setErrorMessage, errorModalOpen, setErrorModalOpen } = useBehandlingProvider();

    useEffect(() => {
        return () => {
            setErrorModalOpen(false);
            setErrorMessage(null);
        };
    }, []);

    return (
        <Modal
            open={errorModalOpen}
            onClose={() => {
                setErrorModalOpen(false);
                setErrorMessage(null);
            }}
            aria-labelledby="modal-heading"
            className="error-modal"
        >
            <Modal.Header>
                <Heading level="1" size="large" id="modal-heading">
                    <div className="error-heading">
                        <XMarkOctagonFillIcon title="a11y-title" fontSize="1.5rem" className="error-icon" />
                        {errorMessage?.title}
                    </div>
                </Heading>
            </Modal.Header>
            <Modal.Body>
                <BodyLong className="error-body">{errorMessage?.text}</BodyLong>
            </Modal.Body>
        </Modal>
    );
};
