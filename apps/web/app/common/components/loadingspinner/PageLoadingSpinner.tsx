import { Heading, Loader } from "@navikt/ds-react";
import React from "react";

interface PageLoadingSpinnerProps {
    text?: string;
}
export default function PageLoadingSpinner({ text }: PageLoadingSpinnerProps) {
    return (
        <div style={{ position: "absolute", left: "50%", top: "50%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Loader size={"xlarge"} />
                <Heading size="large">{text ?? "Laster..."}</Heading>
            </div>
        </div>
    );
}
