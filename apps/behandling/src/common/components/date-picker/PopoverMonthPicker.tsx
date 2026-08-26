import { MonthPicker, useMonthpicker } from "@navikt/ds-react";
import { useId, useRef } from "react";

interface PopoverMonthPickerProps {
    label: string;
    description?: string;
    value?: string;
    onChange?: (date: Date | undefined) => void;
    fromDate?: Date;
    toDate?: Date;
    defaultSelected?: Date;
    inputFormat?: string;
    size?: "small" | "medium";
    className?: string;
}

export function PopoverMonthPicker({
    label,
    description,
    value,
    onChange,
    fromDate,
    toDate,
    defaultSelected,
    inputFormat = "MM.yyyy",
    size = "small",
    className,
}: PopoverMonthPickerProps) {
    const triggerRef = useRef<HTMLDivElement>(null);
    const uniqueId = useId().replace(/:/g, "");
    const wrapperClassName = `monthpicker-wrapper-${uniqueId}`;

    const { monthpickerProps, inputProps } = useMonthpicker({
        defaultSelected,
        inputFormat,
        fromDate,
        toDate,
        onMonthChange: (date) => {
            onChange?.(date);
        },
    });

    return (
        <div ref={triggerRef} className={className}>
            <MonthPicker {...monthpickerProps} wrapperClassName={wrapperClassName}>
                <MonthPicker.Input
                    {...inputProps}
                    label={label}
                    description={description}
                    value={value || ""}
                    size={size}
                    id="popover-monthpicker-input"
                    style={{ cursor: "pointer" }}
                />
            </MonthPicker>
        </div>
    );
}
