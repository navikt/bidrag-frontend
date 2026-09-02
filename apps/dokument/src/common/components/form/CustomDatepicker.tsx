import { toISODateString } from "@bidrag/common";
import { DatePicker, useDatepicker } from "@navikt/ds-react";
import { useRef } from "react";
import type { Matcher } from "react-day-picker";

import { parseDateFromDDMMYYYY } from "../../utils/DateUtils";

interface CustomDatepickerProps {
    id?: string;
    onChange: (date: string) => void;
    value: string;
    initialValue?: string;
    error?: string;
    maxValidDate?: string;
    minValidDate?: string;
    invalidDateRanges?: Matcher[];
    name?: string;
    inputRef?: (ref: HTMLInputElement) => void;
}

export default function CustomDatepicker({
    onChange,
    value,
    error,
    maxValidDate,
    initialValue,
    minValidDate,
    invalidDateRanges,
    name,
    inputRef,
}: CustomDatepickerProps) {
    const fromDate = minValidDate ? parseDateFromDDMMYYYY(minValidDate) : null;
    const toDate = maxValidDate ? parseDateFromDDMMYYYY(maxValidDate) : null;

    const containerRef = useRef<HTMLDivElement>(null);
    const { datepickerProps, inputProps } = useDatepicker({
        disabled: invalidDateRanges,
        fromDate,
        toDate,
        onDateChange: onDateChange,
        defaultSelected: initialValue ? parseDateFromDDMMYYYY(initialValue) : null,
    });

    function onDateChange(date: Date) {
        if (date) {
            onChange(toISODateString(date));
        }
    }

    function getError() {
        return error ?? undefined;
    }

    return (
        <div ref={containerRef}>
            <DatePicker showWeekNumber {...datepickerProps}>
                <DatePicker.Input
                    size="small"
                    ref={(ref) => inputRef?.(ref)}
                    error={getError()}
                    name={name}
                    label="Velg dato"
                    hideLabel
                    defaultValue={value}
                    {...inputProps}
                />
            </DatePicker>
        </div>
    );
}
