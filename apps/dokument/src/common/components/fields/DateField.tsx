import { BodyShort, Label } from "@navikt/ds-react";
import { type CSSProperties, type MutableRefObject, useState } from "react";
import type { Matcher } from "react-day-picker";
import { formatDate, isValidDate } from "../../utils/DateUtils";
import CustomDatepicker from "../form/CustomDatepicker";

interface EditableDateFieldProps {
    id?: string;
    name?: string;
    onChange?: (value: string) => void;
    value: string;
    label?: string;
    editable?: boolean;
    valueType?: "BodyShort" | "sidetittel";
    error?: string;
    containerRef?: MutableRefObject<HTMLDivElement>;
    inputRef?: (ref: HTMLInputElement) => void;
    style?: CSSProperties;
    invalidDateRanges?: Matcher[];
    maxValidDate?: string;
    minValidDate?: string;
}

export default function DateField(props: EditableDateFieldProps) {
    const { label, value, onChange, editable = false } = props;
    const [dateError, setDateError] = useState<string>();

    function validateDate(date: string) {
        if (!isValidDate(date)) {
            setDateError("Ugyldig format på dato");
            return false;
        }

        setDateError(undefined);
        return true;
    }

    function onDateChange(date: string) {
        if (validateDate(date)) {
            onChange?.(date);
        } else {
            onChange?.(undefined);
        }
    }

    return (
        <div
            id={`${props.id ?? "date"}_container`}
            style={{ ...props.style, display: "flex", flexDirection: "column" }}
            ref={props.containerRef}
        >
            {label && (
                <Label size="small" htmlFor={props.id}>
                    {label}
                </Label>
            )}
            {editable ? (
                <div>
                    <CustomDatepicker
                        id={props.id}
                        value={value}
                        initialValue={value}
                        name={props.name}
                        minValidDate={props.minValidDate}
                        maxValidDate={props.maxValidDate}
                        onChange={onDateChange}
                        error={props.error ?? dateError}
                        inputRef={props.inputRef}
                        invalidDateRanges={props.invalidDateRanges}
                    />
                </div>
            ) : (
                <BodyShort id={props.id}>{formatDate(value)}</BodyShort>
            )}
        </div>
    );
}
