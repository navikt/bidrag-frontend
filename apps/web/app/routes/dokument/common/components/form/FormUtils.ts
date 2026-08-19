import React from "react";

export const handleSubmitPreventPropagation = (handleSubmit: (e) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(e);
};
