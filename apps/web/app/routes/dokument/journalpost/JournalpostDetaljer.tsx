import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import { Heading, HStack, Tag, VStack } from "@navikt/ds-react";

function getStatusVariant(status?: JournalpostStatus | null) {
    if (!status) return "neutral";

    if ([JournalpostStatus.FERDIGSTILT, JournalpostStatus.EKSPEDERT].includes(status)) return "success";
    if ([JournalpostStatus.FEILREGISTRERT, JournalpostStatus.RETUR, JournalpostStatus.AVBRUTT].includes(status))
        return "error";
    if (status === JournalpostStatus.UNDER_PRODUKSJON) return "warning";
    if ([JournalpostStatus.UNDER_OPPRETTELSE, JournalpostStatus.KLAR_FOR_DISTRIBUSJON].includes(status)) return "info";

    return "neutral";
}

const getTagVariant = (jp: JournalpostDto) => {
    switch (jp.status) {
        case JournalpostStatus.UNDER_OPPRETTELSE:
        case JournalpostStatus.KLAR_FOR_DISTRIBUSJON:
            return "info";
        case JournalpostStatus.UNDER_PRODUKSJON:
            return "warning";
        case JournalpostStatus.FERDIGSTILT:
            return "success";
        case JournalpostStatus.FEILREGISTRERT:
        case JournalpostStatus.RETUR:
            return "error";
        default:
            return "neutral";
    }
};

export function JournalpostDetaljer({ journalpost }: { journalpost: JournalpostDto }) {
    if (!journalpost) return null;

    const tittel = journalpost.innhold || `Journalpost ${journalpost.journalpostId}`;

    return (
        <VStack gap="space-2">
            <Heading size="small" spacing={false}>
                {tittel}
            </Heading>
            <HStack gap="space-2" align="center" wrap>
                {journalpost.status && (
                    <Tag size="small" variant={getStatusVariant(journalpost.status)}>
                        {journalpost.status}
                    </Tag>
                )}

                <Tag size="small" variant={getTagVariant(journalpost)} className="shrink-0">
                    {journalpost.dokumentType ?? "?"}
                </Tag>
            </HStack>
        </VStack>
    );
}
