import "./NoAccessModal.less";

import { Alert, Button, Heading, Loader, Modal } from "@navikt/ds-react";
import React, { ReactElement, useState } from "react";

export interface NoAccessModalProps {
    alertContent: ReactElement | string;
    submitButtonLabel?: string;
    onCancel: () => void;
    onSubmit?: (() => Promise<void>) | (() => void);
    loadingData?: boolean;
}

export default function NoAccessModal(props: NoAccessModalProps) {
    const { alertContent, onCancel, submitButtonLabel } = props;
    const [pendingSubmit, setPendingSubmit] = useState<boolean>(false);

    function onSubmit() {
        setPendingSubmit(true);
        const submit = props.onSubmit();
        if (submit) {
            submit.finally(() => setPendingSubmit(false));
        }
    }

    return (
        <Modal
            aria-label="ingen tilgang"
            className="no-access-modal"
            onClose={onCancel}
            closeOnBackdropClick={true}
            open
        >
            <Modal.Header closeButton>
                <Heading size="large">Ingen tilgang</Heading>
            </Modal.Header>
            {props.loadingData ? (
                <Loader />
            ) : (
                <Modal.Body className={"no-access-modal-content"}>
                    <Alert variant="error" size="small" className={"alertstripe"}>
                        {alertContent}
                    </Alert>
                    <div className={"button-panel"}>
                        <Button
                            className={"cancelbutton"}
                            disabled={pendingSubmit}
                            onClick={onCancel}
                            variant="tertiary"
                        >
                            Avbryt
                        </Button>
                        {props.onSubmit && (
                            <Button className={"confirmbutton"} onClick={onSubmit} loading={pendingSubmit}>
                                {submitButtonLabel}
                            </Button>
                        )}
                    </div>
                </Modal.Body>
            )}
        </Modal>
    );
}
