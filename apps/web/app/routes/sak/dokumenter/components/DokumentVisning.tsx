import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { BodyShort, Box, Detail, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useHentDokumentMetadata } from "~/api/useApi.ts";
import { DomCachedPdfFremviser } from "~/common/dokument/DomCachedPdfFremviser";
import { DokumentKategoriTag } from "../utils/dokumentKategori";
import type { DokumentData, FilterState, MenyState } from "./hooks/useDokumentState";
import { useFyllGjenværendeHøyde } from "./hooks/useFyllGjenværendeHøyde";
import { VenstreMeny } from "./VenstreMeny";

export interface DokumentVisningProps {
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
    sakRoller?: RolleDto[];
    skjulKontroller?: boolean;
    /** Flat dokumentliste uten journalpost-gruppering. */
    flatDokumentliste?: boolean;
    /** Ekstra innhold vist over dokumentlisten i venstremenyen, f.eks. journalpost-metadata. */
    venstreMenyHeader?: ReactNode;
}

/**
 * Felles dokumentvisning: venstreliste/tabell med filtrering + PDF-fremviser til høyre,
 * begrenset til gjenværende høyde slik at kun PDF-fremviseren scroller.
 *
 * Brukes både av `SaksdokumenterVisning` (alle journalposter på en sak) og `JournalpostFremviser`
 * (én enkelt journalpost) – sistnevnte sender inn kun sin egen journalpost i `data`.
 */
export function DokumentVisning({
    data,
    filterState,
    menyState,
    sakRoller = [],
    skjulKontroller = false,
    flatDokumentliste = false,
    venstreMenyHeader,
}: DokumentVisningProps) {
    const valgtDokument = data.selectedDocument;

    const skalHenteMetadata = Boolean(valgtDokument?.kanÅpnes && valgtDokument?.dokumentreferanse);

    const { error: metadataError } = useHentDokumentMetadata(
        valgtDokument?.journalpostId ?? "",
        valgtDokument?.dokumentreferanse,
        skalHenteMetadata,
    );

    if (metadataError) throw metadataError;

    const { ref, høyde } = useFyllGjenværendeHøyde<HTMLDivElement>();

    return (
        <HStack
            ref={ref}
            gap="space-4"
            align="stretch"
            height={høyde !== undefined ? `${høyde}px` : undefined}
            overflow="hidden"
        >
            <VStack marginBlock="space-4 space-0" height="100%" minHeight="0" overflow="hidden">
                <VenstreMeny
                    sakRoller={sakRoller}
                    data={data}
                    filterState={filterState}
                    menyState={menyState}
                    skjulKontroller={skjulKontroller}
                    flatDokumentliste={flatDokumentliste}
                    header={venstreMenyHeader}
                />
            </VStack>
            <VStack flexGrow="1" minWidth="0" gap="space-2" height="100%" minHeight="0">
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
