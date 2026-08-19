import { BodyShort } from "@navikt/ds-react";
import React from "react";
import { ReactElement } from "react";

interface LabeledText {
    label: string;
    value: ReactElement | string;
}
export default function SimpleTextField({ label, value }: LabeledText) {
    return (
        <BodyShort size="small" style={{ display: "flex", flexDirection: "row", gap: "5px" }}>
            <span>
                <strong>{label}:</strong>
            </span>
            <span>{value}</span>
        </BodyShort>
    );
}
