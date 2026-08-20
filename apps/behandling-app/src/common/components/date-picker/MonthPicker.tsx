import { type MonthValidationT, MonthPicker as NavMonthPicker, useMonthpicker } from "@navikt/ds-react";
import React, { useEffect } from "react";
import { dateOrNull, isValidDate, lastDayOfMonth } from "../../../utils/date-utils";

/** Bruk matcher-typen fra ds-react sin egen react-day-picker-versjon. */
export type MonthMatcher = NonNullable<NonNullable<Parameters<typeof useMonthpicker>[0]>["disabled"]>[number];

interface MonthPickerInputProps {
    onChange: (selectedDay: Date | undefined) => void;
    label: string;
    fromDate?: Date;
    placeholder?: string;
    hideLabel?: boolean;
    className?: string;
    defaultValue?: string;
    error?: string;
    onValidate?: (monthValidation: MonthValidationT) => void;
    toDate?: Date;
    lastDayOfMonthPicker?: boolean;
    readonly?: boolean;
    fieldValue?: Date | string;
    disabledMonths?: MonthMatcher[];
}
export const MonthPicker = ({
    label,
    onChange,
    fromDate,
    toDate,
    placeholder,
    hideLabel,
    className,
    defaultValue,
    onValidate,
    error,
    lastDayOfMonthPicker,
    readonly,
    fieldValue,
    disabledMonths,
}: MonthPickerInputProps) => {
    const { monthpickerProps, inputProps, setSelected, selectedMonth } = useMonthpicker({
        fromDate,
        toDate,
        defaultSelected: isValidDate(new Date(defaultValue)) ? dateOrNull(defaultValue) : null,
        inputFormat: "dd.MM.yyyy",
        onValidate: (val) => onValidate?.(val),
        onMonthChange: (date) => onChange(date),
        disabled: disabledMonths,
    });

    const onMonthSelect = (date) => {
        const dateToSave = isValidDate(date) ? (lastDayOfMonthPicker ? lastDayOfMonth(date) : date) : null;
        monthpickerProps.onMonthSelect(dateToSave);
    };

    useEffect(() => {
        const value = fieldValue === null ? null : new Date(fieldValue);
        if (
            (isValidDate(value) && selectedMonth?.toLocaleString() !== value?.toLocaleString()) ||
            (value === null && selectedMonth !== null)
        ) {
            setSelected(value);
        }
    }, [defaultValue, fieldValue]);

    return (
        <>
            <NavMonthPicker {...monthpickerProps} onMonthSelect={onMonthSelect} dropdownCaption>
                <NavMonthPicker.Input
                    {...inputProps}
                    className={`${className} [&_input]:w-[96px] [&_input]:placeholder:text-ax-small`}
                    label={label}
                    error={error}
                    readOnly={readonly}
                    hideLabel={hideLabel}
                    placeholder={placeholder}
                    size="small"
                />
            </NavMonthPicker>
        </>
    );
};
