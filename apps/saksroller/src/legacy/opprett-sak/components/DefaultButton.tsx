import { Button } from "@navikt/ds-react";
import type { ButtonHTMLAttributes } from "react";

// Migrert fra bidrag-ui (apps/sak-ui/src/components/button/default-button/DefaultButton.tsx).
interface IDefaultButton extends ButtonHTMLAttributes<HTMLButtonElement> {
    title: string;
    testId?: string;
    isPrimary?: boolean;
}

export default function DefaultButton({ title, testId, isPrimary = false, ...props }: IDefaultButton) {
    return (
        <Button data-testid={testId} size="xsmall" variant={isPrimary ? "primary" : "secondary"} {...props}>
            {title}
        </Button>
    );
}
