import { Button } from "@navikt/ds-react";
import { ButtonHTMLAttributes } from "react";
import React from "react";

interface IDefaultButton extends ButtonHTMLAttributes<HTMLButtonElement> {
    title: string;
    testId?: string;
    isPrimary?: boolean;
    size?: "medium" | "small" | "xsmall";
}
export default function DefaultButton({ title, testId, isPrimary = false, size = "xsmall", ...props }: IDefaultButton) {
    return (
        <Button data-testid={testId} size={size} variant={isPrimary ? "primary" : "secondary"} {...props}>
            {title}
        </Button>
    );
}
