import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Heading, HStack, VStack } from "@navikt/ds-react";
import { useHentDokumentMetadata, useHentSak } from "~/api/useApi.ts";
import { PdfVisning } from "~/common/dokument/PdfVisning";
import { useDokumentState } from "./hooks/useDokumentState";
import { useOppdaterPdfFremviser } from "./hooks/useOppdaterPdfFremviser";
import { VenstreMeny } from "./VenstreMeny";

export function SaksdokumenterVisning({
    saksnummer,
    journalposter,
}: {
    saksnummer: string;
    journalposter: JournalpostDto[];
}) {
    const { data: sak } = useHentSak(saksnummer);
    const sakRoller = (sak?.roller ?? []) as RolleDto[];

    const { data, filterState, menyState } = useDokumentState(journalposter);

    const gjelderMetadata = Boolean(data.selectedDocument?.kanÅpnes && data.selectedDocument?.dokumentreferanse);
    const {
        data: metadata = [],
        isLoading: isMetadataLoading,
        error: metadataError,
    } = useHentDokumentMetadata(
        data.selectedDocument?.journalpostId ?? "",
        data.selectedDocument?.dokumentreferanse,
        gjelderMetadata,
    );

    if (metadataError) throw metadataError;

    const viewerState = useOppdaterPdfFremviser(data.selectedDocument, metadata, gjelderMetadata, isMetadataLoading);

    return (
        <HStack gap="space-4" align="start">
            <VStack>
                <Heading size="medium">Dokumenter for sak {saksnummer}</Heading>
                <VenstreMeny sakRoller={sakRoller} data={data} filterState={filterState} menyState={menyState} />
            </VStack>
            <PdfVisning
                title={
                    data.selectedDocument?.tittel ??
                    `${data.selectedDocument?.journalpostTittel ?? `Journapost id ${data.selectedDocument?.journalpostId}`}`
                }
                viewerState={viewerState}
            />
        </HStack>
    );
}
