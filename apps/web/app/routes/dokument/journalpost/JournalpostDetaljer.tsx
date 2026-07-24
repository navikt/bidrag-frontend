import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import { Detail, Heading, HStack, Tag, VStack } from "@navikt/ds-react";

function getStatusVariant(status?: JournalpostStatus | null) {
    if (!status) return "neutral";

    if ([JournalpostStatus.FERDIGSTILT, JournalpostStatus.EKSPEDERT].includes(status)) return "success";
    if ([JournalpostStatus.FEILREGISTRERT, JournalpostStatus.RETUR, JournalpostStatus.AVBRUTT].includes(status))
        return "error";
    if (status === JournalpostStatus.UNDER_PRODUKSJON) return "warning";
    if ([JournalpostStatus.UNDER_OPPRETTELSE, JournalpostStatus.KLAR_FOR_DISTRIBUSJON].includes(status)) return "info";

    return "neutral";
}

function formaterDato(datoString?: string | null) {
    if (!datoString) return null;
    return new Date(datoString).toLocaleDateString("no-NO");
}

export function JournalpostDetaljer({ journalpost }: { journalpost?: JournalpostDto | null }) {
    if (!journalpost) return null;

    const tittel = journalpost.innhold || `Journalpost ${journalpost.journalpostId}`;
    const dato = formaterDato(journalpost.journalfortDato) || formaterDato(journalpost.dokumentDato);
    const gjelderIdent = journalpost.gjelderAktor?.ident || journalpost.gjelderIdent;

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
                {journalpost.dokumentType && <Detail textColor="subtle">{journalpost.dokumentType}</Detail>}
                {dato && <Detail textColor="subtle">{dato}</Detail>}
            </HStack>
            {gjelderIdent && (
                <HStack gap="space-2" align="center">
                    <Detail textColor="subtle">Gjelder:</Detail>
                    <Detail>{gjelderIdent}</Detail>
                </HStack>
            )}
        </VStack>
    );
}
