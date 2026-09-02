import { Popover } from "@navikt/ds-react";
import { useRef, useState } from "react";

import type { Dokument } from "../../../types/journalpost";

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
            {/* biome-ignore lint/a11y/noStaticElementInteractions: viser en tooltip ved hover/fokus, ikke en interaktiv kontroll */}
            <span
                style={{ margin: "0" }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
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
                placement={"bottom"}
            >
                <Popover.Content style={{ wordWrap: "break-word", flexWrap: "wrap", maxWidth: "400px" }}>
                    {dokument.tittelDisplayValue}
                </Popover.Content>
            </Popover>
        </>
    );
}
