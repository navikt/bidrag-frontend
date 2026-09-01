import { useEffect, useRef } from "react";
import {
    type FieldError,
    type FieldPath,
    type FieldValues,
    type RegisterOptions,
    type UseFormRegisterReturn,
    useFormContext,
} from "react-hook-form";

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
        registerReturn.current = register(fieldName, options as RegisterOptions<T, FieldPath<T>>);
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
