import type { DateValidationT } from "@navikt/ds-react";
import React from "react";
import { useController, useFormContext } from "react-hook-form";
import { toISODateString } from "../../../utils/date-utils";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { DatePickerInput } from "../date-picker/DatePickerInput";

interface FormControlledDatePickerProps {
    name: string;
    label: string;
    defaultValue: string | null;
    placeholder: string;
    hideLabel?: boolean;
    className?: string;
    required?: boolean;
    onChange?: (date: Date | undefined) => void;
    toDate?: Date;
}

export const FormControlledDatePicker = ({
    name,
    label,
    defaultValue,
    placeholder,
    hideLabel,
    className,
    required,
    onChange,
    toDate,
}: FormControlledDatePickerProps) => {
    const { lesemodus } = useBehandlingProvider();
    const { control, setError, clearErrors } = useFormContext();
    const { field, fieldState } = useController({
        name,
        control,
        rules: { required: required ? "Dette feltet er påkrevd" : false },
    });

    const handleChange = (date: Date) => {
        const value = date ? toISODateString(date) : null;
        field.onChange(value);

        if (onChange) {
            onChange(date);
        }
    };

    const onValidate = (dateValidation: DateValidationT) => {
        if (!dateValidation.isValidDate && !dateValidation.isEmpty) {
            setError(name, { type: "notValid", message: text.error.datoIkkeGyldig });
            return;
        }
        clearErrors(name);
    };

    return (
        <DatePickerInput
            label={label}
            readOnly={lesemodus}
            placeholder={placeholder}
            onChange={(value) => handleChange(value)}
            defaultValue={defaultValue}
            hideLabel={hideLabel}
            className={className}
            error={fieldState?.error?.message}
            onValidate={onValidate}
            fieldValue={field.value}
            toDate={toDate}
        />
    );
};
