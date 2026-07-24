import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Heading, HStack, VStack } from "@navikt/ds-react";
import { useHentDokumentMetadata, useHentSak } from "~/api/useApi.ts";
import { DomCachedPdfFremviser } from "~/common/dokument/DomCachedPdfFremviser";
import { useDokumentState } from "./hooks/useDokumentState";
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
    const valgtDokument = data.selectedDocument;

    const skalHenteMetadata = Boolean(valgtDokument?.kanÅpnes && valgtDokument?.dokumentreferanse);

    const { error: metadataError } = useHentDokumentMetadata(
        valgtDokument?.journalpostId ?? "",
        valgtDokument?.dokumentreferanse,
        skalHenteMetadata,
    );

    if (metadataError) throw metadataError;

    return (
        <HStack gap="space-4" align="start">
            <VStack>
                <Heading size="medium">Dokumenter for sak {saksnummer}</Heading>
                <VenstreMeny sakRoller={sakRoller} data={data} filterState={filterState} menyState={menyState} />
            </VStack>
            <DomCachedPdfFremviser
                dokumenter={data.dokumenter}
                valgtDokumentreferanse={valgtDokument?.dokumentreferanse}
            />
        </HStack>
    );
}
