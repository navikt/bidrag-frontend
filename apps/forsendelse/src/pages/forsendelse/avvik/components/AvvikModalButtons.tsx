import { Button } from "@navikt/ds-react";

import { useAvvikModalContext } from "../AvvikshandteringButton";

interface AvvikModalButtonsProps {
    onSubmit?: () => void;
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
    return (
        <div className={"mt-4 flex flex-row gap-[10px] flex-wrap flex-row-reverse"}>
            <Button
                variant={"primary"}
                size="small"
                onClick={onSubmit}
                id={"avvik-confirm-button"}
                disabled={disabled}
                loading={loading}
            >
                {submitButtonLabel}
            </Button>
            <Button size="small" variant={"tertiary"} onClick={onCancel} id={"avvik-cancel-button"}>
                Forkast
            </Button>
        </div>
    );
}
