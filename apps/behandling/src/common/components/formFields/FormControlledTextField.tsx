import { BodyShort, TextField } from "@navikt/ds-react";
import type React from "react";
import { useController, useFormContext } from "react-hook-form";

import { useBehandlingProvider } from "../../context/BehandlingContext";

export const FormControlledTextField = ({
    name,
    label,
    hideLabel,
    type,
    disabled,
    min,
    editable = true,
    inputMode,
    max,
    step,
    prefix,
    width,
}: {
    name: string;
    label: string;
    hideLabel?: boolean;
    type?: "number" | "email" | "password" | "tel" | "text" | "url";
    disabled?: boolean;
    editable?: boolean;
    prefix?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    inputMode?: "email" | "tel" | "text" | "url" | "search" | "none" | "numeric" | "decimal";
    width?: string;
}) => {
    const { control, clearErrors } = useFormContext();
    const { field, fieldState } = useController({ name, control });
    const { lesemodus } = useBehandlingProvider();
    let maxFractionDigits: number | undefined;

    if (step !== undefined) {
        const stepValue = typeof step === "number" ? step.toString() : step;
        const fractionalStep = stepValue.split(".")?.[1];
        maxFractionDigits = fractionalStep ? fractionalStep.length : 0;
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearErrors(name);
        if (["numeric", "decimal"].includes(inputMode) && e.target.value === "") {
            field.onChange(0);
            return;
        }
        if (inputMode === "numeric") {
            field.onChange(Number(Number(e.target.value).toFixed()));
            return;
        }

        if (inputMode === "decimal") {
            const [integerPart, fractionalPart] = e.target.value.split(".");
            if (maxFractionDigits !== undefined && fractionalPart && fractionalPart.length > maxFractionDigits) {
                const trimmedValue = `${integerPart}.${fractionalPart.slice(0, maxFractionDigits)}`;
                field.onChange(trimmedValue);
                return;
            }

            if (maxFractionDigits !== undefined) {
                const fractionalLength = fractionalPart ? Math.min(fractionalPart.length, maxFractionDigits) : 0;
                field.onChange(Number.parseFloat(e.target.value).toFixed(fractionalPart ? fractionalLength : 0));
                return;
            }

            const secondFractionalDigit = fractionalPart?.[1];
            const numberOfFractionalDigits = secondFractionalDigit ? 2 : 1;
            field.onChange(Number.parseFloat(e.target.value).toFixed(fractionalPart ? numberOfFractionalDigits : 0));
            return;
        }
        field.onChange(e.target.value);
    };

    if (!editable) {
        const value = prefix ? `${prefix}${field.value ? `, ${field.value}` : ""}` : field.value;
        return (
            <div className={`min-h-6 flex items-center ${type === "number" ? "justify-end" : ""}`}>
                <BodyShort size="small">{value}</BodyShort>
            </div>
        );
    }

    return (
        <TextField
            type={type}
            label={label}
            size="small"
            readOnly={lesemodus}
            value={field?.value?.toString() ?? ""}
            onChange={(value) => onChange(value)}
            hideLabel={hideLabel}
            disabled={disabled}
            error={fieldState?.error?.message}
            min={min}
            max={max}
            style={width ? { width: width } : undefined}
            step={step}
            inputMode={inputMode}
            onKeyDown={(e) => {
                if (inputMode === "numeric" && [",", "."].includes(e.key)) {
                    e.preventDefault();
                }
            }}
        />
    );
};
