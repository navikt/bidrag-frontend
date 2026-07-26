import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { BodyShort, Box, Detail, Heading, HStack, VStack } from "@navikt/ds-react";
import { useHentDokumentMetadata, useHentSak } from "~/api/useApi.ts";
import { DomCachedPdfFremviser } from "~/common/dokument/DomCachedPdfFremviser";
import { DokumentKategoriTag } from "../utils/dokumentKategori";
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
            <VStack flexGrow="1" minWidth="0" gap="space-2">
                {/* Enkel dokumentheader: viser hvilket dokument som vises, uten ekstra støy */}
                <Box paddingInline="space-4" paddingBlock="space-2 space-0">
                    {valgtDokument ? (
                        <HStack gap="space-4" align="center" wrap={false}>
                            <BodyShort weight="semibold" truncate>
                                {valgtDokument.tittel}
                            </BodyShort>
                            <DokumentKategoriTag dokumentType={valgtDokument.dokumentType} />
                            {valgtDokument.dokumentDato && <Detail>{formaterDato(valgtDokument.dokumentDato)}</Detail>}
                        </HStack>
                    ) : (
                        <Detail>Velg et dokument i listen til venstre. Bruk piltast opp/ned for å bla.</Detail>
                    )}
                </Box>
                <DomCachedPdfFremviser
                    dokumenter={data.alleDokumenter}
                    valgtDokumentreferanse={valgtDokument?.dokumentreferanse}
                />
            </VStack>
        </HStack>
    );
}
