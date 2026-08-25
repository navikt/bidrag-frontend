import type { MonthValidationT } from "@navikt/ds-react";
import { useController, useFormContext } from "react-hook-form";
import { isFirstDayOfMonth, isLastDayOfMonth, toISODateString } from "../../../utils/date-utils";

import text from "../../constants/texts";
import { type MonthMatcher as Matcher, MonthPicker } from "../date-picker/MonthPicker";

interface FormControlledDatePickerProps {
    name: string;
    label: string;
    defaultValue: string | null;
    placeholder: string;
    hideLabel?: boolean;
    className?: string;
    required?: boolean;
    onChange?: (date: string | null) => void;
    customValidation?: (date: string) => void;
    toDate?: Date;
    fromDate?: Date;
    lastDayOfMonthPicker?: boolean;
    disabledMonths?: Matcher[];
    readonly?: boolean;
}

export const FormControlledMonthPicker = ({
    name,
    label,
    defaultValue,
    placeholder,
    hideLabel,
    className,
    required,
    onChange,
    toDate,
    fromDate,
    lastDayOfMonthPicker,
    customValidation,
    disabledMonths,
    readonly,
}: FormControlledDatePickerProps) => {
    const { control, setError, clearErrors, getValues } = useFormContext();
    const { field, fieldState } = useController({
        name,
        control,
        rules: { required: required ? "Dette feltet er påkrevd" : false },
    });

    const handleChange = (date: Date) => {
        const value = date ? toISODateString(date) : null;

        if (onChange) {
            onChange(value);
        } else {
            field.onChange(value);
        }
    };

    const onValidate = (monthValidation: MonthValidationT) => {
        const date: string = getValues(name);
        const isFirstOrLastDayOfMonth = lastDayOfMonthPicker
            ? isLastDayOfMonth(new Date(date))
            : isFirstDayOfMonth(new Date(date));

        const invalidDate =
            !monthValidation.isValidMonth && !monthValidation.isEmpty ? text.error.datoIkkeGyldig : undefined;
        const emptyField = required && monthValidation.isEmpty ? text.error.datoMåFyllesUt : undefined;
        const isNotFirstOrLastDayOfMonth = date && !isFirstOrLastDayOfMonth;
        const notFirstDayOrLastDayOfMonthError = isNotFirstOrLastDayOfMonth
            ? lastDayOfMonthPicker
                ? text.error.datoMåVæreDenSisteIMåneden
                : text.error.datoMåVæreDenFørsteIMåneden
            : undefined;
        const error = invalidDate || emptyField || notFirstDayOrLastDayOfMonthError;

        if (error) {
            setError(name, { type: "notValid", message: error });
            return;
        }

        clearErrors(name);
        customValidation?.(date);
    };

    return (
        <MonthPicker
            label={label}
            readonly={readonly}
            placeholder={placeholder}
            onChange={(value) => handleChange(value)}
            defaultValue={defaultValue}
            hideLabel={hideLabel}
            className={className}
            error={fieldState?.error?.message}
            onValidate={onValidate}
            toDate={toDate}
            fromDate={fromDate}
            lastDayOfMonthPicker={lastDayOfMonthPicker}
            fieldValue={field.value}
            disabledMonths={disabledMonths}
        />
    );
};
