import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import { Tag } from "@navikt/ds-react";
import type { ComponentProps } from "react";
import { EKSPEDERT_STATUSER, journalstatusDisplayVerdi } from "./journalpostUtils";

function journalstatusColor(jp: JournalpostDto): ComponentProps<typeof Tag>["data-color"] {
    const status = jp.status;

    if (status === JournalpostStatus.UNDER_OPPRETTELSE) return "warning";
    if (status === JournalpostStatus.UNDER_PRODUKSJON) return "info";
    if (status === JournalpostStatus.FEILREGISTRERT || status === JournalpostStatus.RETUR) return "danger";
    if (status === JournalpostStatus.KLAR_FOR_DISTRIBUSJON) return undefined;
    if (status && EKSPEDERT_STATUSER.includes(status)) return undefined;

    return undefined;
}

export default function JournalpostStatusTag({ jp }: { jp: JournalpostDto }) {
    const color = journalstatusColor(jp);
    if (color) {
        return (
            <Tag variant="moderate" data-color={color} size="small">
                {journalstatusDisplayVerdi(jp)}
            </Tag>
        );
    }
    return <>{journalstatusDisplayVerdi(jp)}</>;
}
