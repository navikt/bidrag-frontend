import { Textarea } from "@navikt/ds-react";
import type { MutationStatus } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { SaveStatusIndicator } from "../SaveStatusIndicator";

const FormControlledInputLabel = ({ label, mutationState }: { label: string; mutationState?: MutationStatus }) => {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{label}</span>
            {mutationState && mutationState !== "idle" && <SaveStatusIndicator mutationStatus={mutationState} />}
        </div>
    );
};
export const FormControlledTextarea = ({
    name,
    label,
    hideLabel,
    minRows,
    className,
    description,
    resize,
    mutationState,
}: {
    name: string;
    label: string;
    hideLabel?: boolean;
    minRows?: number;
    className?: string;
    description?: React.ReactNode;
    resize?: boolean;
    mutationState?: MutationStatus;
}) => {
    const { control, clearErrors } = useFormContext();
    const { lesemodus } = useBehandlingProvider();

    const { field, fieldState } = useController({ name, control });

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        clearErrors(name);
        field.onChange(e.target.value);
    };

    const textareaRef = useRef(null);
    const [constraints, setConstraints] = useState<{ maxHeight: number; maxWidth: number } | undefined>(undefined);

    const recalculateMaxHeight = () => {
        if (textareaRef?.current?.getBoundingClientRect()) {
            const position = textareaRef?.current?.getBoundingClientRect();
            const updatedMaxHeight = window.innerHeight - position.top - 100;
            const updatedMaxWidth = window.innerWidth - position.left - 32;
            setConstraints({ maxHeight: updatedMaxHeight, maxWidth: updatedMaxWidth });
        }
    };

    useEffect(() => {
        if (resize) {
            recalculateMaxHeight();
            window.addEventListener("resize", recalculateMaxHeight);
        }

        return () => window.removeEventListener("resize", recalculateMaxHeight);
    }, []);

    return (
        <Textarea
            label={<FormControlledInputLabel label={label} mutationState={mutationState} />}
            description={description}
            size="small"
            value={field.value}
            onChange={(e) => onChange(e)}
            hideLabel={hideLabel}
            readOnly={lesemodus}
            error={fieldState?.error?.message}
            minRows={minRows}
            className={className}
            resize={resize}
            ref={textareaRef}
            style={constraints ?? undefined}
        />
    );
};
