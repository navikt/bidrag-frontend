import { Button, Loader, Modal } from "@navikt/ds-react";
import { lazy, Suspense, useId, useState } from "react";
import { type ModalSubmit, type NyOpprettSakFlytProps, NyOpprettSakModalContext } from "./opprettSakModalContext";

const OpprettSakFlytInnbygget = lazy(() => import("./OpprettSakFlytInnbygget"));

export type OpprettSakFlytModalProps = Omit<NyOpprettSakFlytProps, "onAvbryt"> & {
    open: boolean;
    onClose: () => void;
};

export function OpprettSakFlytModal({ open, onClose, ...props }: OpprettSakFlytModalProps) {
    const [submit, setSubmit] = useState<ModalSubmit | null>(null);
    const formId = useId();
    const sending = submit?.isLoading ?? false;
    const lukkHvisIkkeSender = () => {
        if (!sending) onClose();
    };
    if (!open) return null;

    return (
        <Modal
            open
            portal
            onClose={lukkHvisIkkeSender}
            onBeforeClose={() => !sending}
            onCancel={(event) => {
                if (sending) event.preventDefault();
            }}
            header={{ heading: "Opprett sak", closeButton: !sending }}
            width="70rem"
            placement="top"
        >
            <Modal.Body>
                <Suspense fallback={<Loader size="3xlarge" title="Laster..." variant="interaction" />}>
                    <NyOpprettSakModalContext value={{ formId, setSubmit }}>
                        <OpprettSakFlytInnbygget {...props} onAvbryt={lukkHvisIkkeSender} />
                    </NyOpprettSakModalContext>
                </Suspense>
            </Modal.Body>
            {submit && (
                <Modal.Footer>
                    <Button
                        variant="primary"
                        type="submit"
                        form={formId}
                        size="xsmall"
                        loading={sending}
                        onClick={submit.onClick}
                    >
                        Opprett
                    </Button>
                    <Button
                        variant="secondary"
                        type="button"
                        size="xsmall"
                        disabled={sending}
                        onClick={lukkHvisIkkeSender}
                    >
                        Avbryt
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
}
