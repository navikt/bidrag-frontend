import { Popover } from "@navikt/ds-react";
import { useState } from "react";
import { useRef } from "react";
import React from "react";

import { Dokument } from "../../../types/journalpost";

interface LabelPopoverProps {
    dokument: Dokument;
}
export default function DokumentLabel({ dokument }: LabelPopoverProps) {
    const [open, setOpen] = useState<boolean>(false);
    const labelRef = useRef<HTMLDivElement>(null);
    if (dokument.dokumentLabel === dokument.dokumentLabelShort) {
        return <>{dokument.dokumentLabel}</>;
    }
    return (
        <>
            <span
                style={{ margin: "0" }}
                onMouseOver={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                ref={labelRef}
            >
                {dokument.dokumentLabelShort}
            </span>
            <Popover
                open={open}
                onClose={() => setOpen(false)}
                anchorEl={labelRef.current}
                offset={15}
                placement={"bottom"}>
                <Popover.Content style={{ wordWrap: "break-word", flexWrap: "wrap", maxWidth: "400px" }}>
                    {dokument.tittelDisplayValue}
                </Popover.Content>
            </Popover>
        </>
    );
}
