import type { FormEvent } from "react";

export const handleSubmitPreventPropagation = (handleSubmit: (e) => void) => (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(e);
};
