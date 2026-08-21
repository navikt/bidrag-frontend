import type { MutationStatus } from "@tanstack/react-query";
import { useController, useFormContext } from "react-hook-form";
import { CustomTextareaEditor } from "../CustomEditor";

export type FormControlledCustomTextEditorProps = {
    name?: string;
    label?: string;
    description?: string;
    prefilledHtml?: string;
    className?: string;
    resize?: boolean;
    readOnly?: boolean;
    loading?: boolean;
    required?: boolean;
    mutationState?: MutationStatus;
};
export function FormControlledCustomTextareaEditor({
    name,
    label,
    description,
    prefilledHtml,
    className,
    resize,
    readOnly,
    required,
    mutationState,
}: FormControlledCustomTextEditorProps) {
    const { control } = useFormContext();
    const { field, fieldState } = useController({
        name,
        control,
        rules: { required: required ? "Dette feltet er påkrevd" : false },
    });

    function onChange(value: string) {
        field.onChange(value);
    }

    return (
        <CustomTextareaEditor
            name={name}
            value={field.value}
            error={fieldState?.error?.message}
            onChange={onChange}
            readOnly={readOnly}
            label={label}
            description={description}
            prefilledHtml={prefilledHtml}
            className={className}
            resize={resize}
            mutationState={mutationState}
        />
    );
}
