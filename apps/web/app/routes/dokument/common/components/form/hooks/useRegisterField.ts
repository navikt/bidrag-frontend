import { useEffect, useRef } from "react";
import { type UseFormRegisterReturn, useFormContext } from "react-hook-form";
import type { FieldError } from "react-hook-form/dist/types/errors";
import type { FieldValues } from "react-hook-form/dist/types/fields";
import type { FieldPath } from "react-hook-form/dist/types/utils";
import type { RegisterOptions } from "react-hook-form/dist/types/validator";

interface UseRegisterOptions {
    enabled?: boolean;
    initialValue?: any;
    validateOnUpdate?: boolean;
}
interface UseRegisterFieldReturn {
    error: FieldError;
    onUpdate: (value: any) => void;
    value: any;
}

export default function useRegisterField<T extends FieldValues>(
    fieldName: FieldPath<T>,
    options: RegisterOptions,
    ref: () => HTMLElement,
    otherOptions: UseRegisterOptions = {},
): UseRegisterFieldReturn {
    const {
        register,
        unregister,
        setValue,
        clearErrors,
        formState: { errors },
        watch,
    } = useFormContext<T>();
    const { enabled = true, initialValue, validateOnUpdate } = otherOptions;

    const registerReturn = useRef<UseFormRegisterReturn>(null);
    useEffect(() => {
        if (enabled) {
            registerFormField();
        }
        return () => unregister(fieldName);
    }, [enabled, options.required]);

    useEffect(() => {
        if (enabled && initialValue) {
            onUpdate(initialValue);
        }
    }, [enabled]);

    function registerFormField() {
        registerReturn.current = register(fieldName, options);
        registerReturn.current.ref(ref());
    }

    function onUpdate(value: any) {
        if (enabled) {
            clearErrors(fieldName);
            setValue(fieldName, value, { shouldValidate: validateOnUpdate });
        }
    }

    function getError() {
        const fieldNameSplit = fieldName.split(".");
        let error;
        for (const fieldIndex in fieldNameSplit) {
            const field = fieldNameSplit[fieldIndex];
            error = fieldIndex === "0" ? errors[field] : error?.[field];
        }
        return error;
    }

    return { error: getError(), onUpdate, value: watch(fieldName) };
}
