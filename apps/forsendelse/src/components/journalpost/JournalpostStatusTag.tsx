import { Tag } from "@navikt/ds-react";

import { IJournalpostStatus } from "../../types/Journalpost";

export const JournalpostStatusTags = {
    [IJournalpostStatus.UNDER_PRODUKSJON]: "alt2",
    [IJournalpostStatus.DISTRIBUERT]: "success",
    [IJournalpostStatus.JOURNALFØRT]: "success",
    [IJournalpostStatus.RESERVERT]: "success",
    [IJournalpostStatus.UNDER_OPPRETELSE]: "alt2",
    [IJournalpostStatus.KLAR_FOR_DISTRIBUSJON]: "warning",
} as const;
export const JournalpostStatusDisplayName = {
    [IJournalpostStatus.UNDER_PRODUKSJON]: "Under produksjon",
    [IJournalpostStatus.DISTRIBUERT]: "Distribuert",
    [IJournalpostStatus.JOURNALFØRT]: "Journalført",
    [IJournalpostStatus.RESERVERT]: "Ferdigstilt",
    [IJournalpostStatus.UNDER_OPPRETELSE]: "Under opprettelse",
    [IJournalpostStatus.KLAR_FOR_DISTRIBUSJON]: "Klar for distribusjon",
} as const;

interface JournalpostStatusTagProps {
    status: IJournalpostStatus | string;
}

export default function JournalpostStatusTag({ status }: JournalpostStatusTagProps) {
    return (
        <Tag variant={JournalpostStatusTags[status]} size="small" className="w-max p-2 rounded-md">
            {JournalpostStatusDisplayName[status] ?? "Ukjent"}
        </Tag>
    );
}
