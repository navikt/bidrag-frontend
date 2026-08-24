import { Select } from "@navikt/ds-react";
import type React from "react";
import type { PropsWithChildren } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useBehandlingProvider } from "../../context/BehandlingContext";

interface Option {
    value: string;
    text: string;
}

interface FormControlledSelectFieldProps {
    name: string;
    label: string;
    options?: Option[];
    hideLabel?: boolean;
    disabled?: boolean;
    className?: string;
    onSelect?: (value: string) => void;
    onBeforeSelect?: (value: string) => void;
}

export const FormControlledSelectField = ({
    name,
    label,
    options,
    hideLabel,
    className,
    onSelect,
    onBeforeSelect,
    disabled,
    children,
}: PropsWithChildren<FormControlledSelectFieldProps>) => {
    const { control } = useFormContext();
    const { field, fieldState } = useController({ name, control });

    const { lesemodus } = useBehandlingProvider();
    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onBeforeSelect?.(field.value);
        const value = e.target.value;
        field.onChange(value);
        onSelect?.(value);
    };

    return (
        <Select
            label={label}
            readOnly={lesemodus || disabled}
            className={className}
            size="small"
            value={field.value}
            onChange={(e) => onChange(e)}
            hideLabel={hideLabel}
            error={fieldState?.error?.message}
        >
            {children ||
                options.map((option) => (
                    <option key={option.text} value={option.value}>
                        {option.text}
                    </option>
                ))}
        </Select>
    );
};
