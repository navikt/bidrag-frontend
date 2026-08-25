import { XMarkOctagonFillIcon } from "@navikt/aksel-icons";
import { Button, Heading } from "@navikt/ds-react";
import { useEffect, useRef } from "react";

import tekster from "../constants/texts";
import { ConfirmationModal } from "./modal/ConfirmationModal";

type ErrorConfirmationModal = {
    onConfirm?: () => void;
    onClose?: () => void;
    onCancel?: () => void;
    open: boolean;
};
export default function ErrorConfirmationModal({ open, onConfirm, onClose, onCancel }: ErrorConfirmationModal) {
    const ref = useRef<HTMLDialogElement>(null);
    function _onConfirm() {
        onConfirm?.();
        onClose?.();
    }

    function rollbackChanges() {
        onCancel?.();
        onClose?.();
    }
    useEffect(() => {
        if (open) ref?.current?.showModal?.();
        else ref?.current?.close?.();
    }, [open]);
    return (
        <ConfirmationModal
            ref={ref}
            closeable={false}
            description={tekster.varsel.endringerIkkeLagret}
            heading={
                <Heading size="small" className="flex gap-x-1.5 items-center">
                    <XMarkOctagonFillIcon
                        title="a11y-title"
                        fontSize="1.5rem"
                        color="var(--ax-text-danger-decoration)"
                    />
                    {tekster.varsel.lagringFeilet}
                </Heading>
            }
            footer={
                <>
                    <Button type="button" onClick={rollbackChanges} size="small">
                        {tekster.label.forkastEndringer}
                    </Button>
                    <Button type="button" variant="secondary" size="small" onClick={_onConfirm}>
                        {tekster.label.lagrePåNytt}
                    </Button>
                </>
            }
        />
    );
}
