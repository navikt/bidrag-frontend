import { BodyShort, Label, Textarea, TextField } from "@navikt/ds-react";
import type { CSSProperties, MutableRefObject } from "react";

interface EditableTextProps {
    id?: string;
    value: string;
    label: string;
    onChange?: (value: string) => void;
    editable?: boolean;
    error?: string;
    containerRef?: MutableRefObject<HTMLDivElement>;
    style?: CSSProperties;
    textArea?: boolean;
    maxLength?: number;
    className?: string;
}

export default function EditableTextField(props: EditableTextProps) {
    const { id, label, value, onChange, editable = false, error } = props;

    return (
        <div
            style={{ ...props.style, display: "flex", flexDirection: "column" }}
            ref={props.containerRef}
            className={"pb-2"}
        >
            {editable ? (
                props.textArea ? (
                    <Textarea
                        id={id}
                        error={error}
                        label={label}
                        maxLength={props.maxLength}
                        value={value}
                        disabled={!editable}
                        onChange={(event) => onChange?.(event.target.value)}
                    />
                ) : (
                    <TextField
                        label={label}
                        type="text"
                        id={id}
                        defaultValue={value}
                        error={error}
                        disabled={!editable}
                        onBlur={(event) => onChange?.(event.target.value)}
                    />
                )
            ) : (
                <div className={props.className}>
                    <Label spacing size={"small"}>
                        {label}
                    </Label>
                    <BodyShort id={id}>{value ?? ""}</BodyShort>
                </div>
            )}
        </div>
    );
}
