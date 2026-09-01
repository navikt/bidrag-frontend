import { Button, type ButtonProps } from "@navikt/ds-react";
import React, { type ReactElement } from "react";

interface IkonKnappProps extends ButtonProps {
    ikonElement: ReactElement;
    tekst?: string;
    ikonPlacement?: "left" | "right";
}

export default function IkonKnapp({ ikonElement, tekst, ikonPlacement = "left", ...buttonProps }: IkonKnappProps) {
    return (
        <Button
            size="small"
            variant="tertiary"
            type="button"
            icon={ikonElement}
            iconPosition={ikonPlacement}
            {...buttonProps}
        >
            {tekst && <div>{tekst}</div>}
        </Button>
    );
}
