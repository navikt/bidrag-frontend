import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Heading, VStack } from "@navikt/ds-react";
import { useHentDokumentMetadata, useHentSak } from "~/api/useApi.ts";
import { useDokumentState } from "./hooks/useDokumentState";
import { useOppdaterPdfFremviser } from "./hooks/useOppdaterPdfFremviser";
import { PdfVisning } from "./PdfVisning";
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
        <>
            <VStack>
                <Heading size="medium">Dokumenter for sak {saksnummer}</Heading>
                <VenstreMeny sakRoller={sakRoller} data={data} filterState={filterState} menyState={menyState} />
            </VStack>
            <PdfVisning
                selectedDocument={data.selectedDocument}
                viewerState={viewerState}
                isMetadataLoading={isMetadataLoading}
            />
        </>
    );
}
