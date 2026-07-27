import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { Button, Loader, VStack } from "@navikt/ds-react";
import { useMemo } from "react";
import { hentDokumentApi, useHentJournalpost } from "~/api/useApi.ts";
import { JournalpostMetadata } from "~/common/dokument/JournalpostMetadata";
import { DokumentVisning } from "../../sak/dokumenter/components/DokumentVisning";
import { useDokumentState } from "../../sak/dokumenter/components/hooks/useDokumentState";
import { JournalpostDetaljer } from "./JournalpostDetaljer";

interface JournalpostFremviserProps {
    journalpostId: string;
    dokumentreferanse?: string;
    hidden?: boolean;
    openInNewTab?: boolean;
    fallbackDokumentreferanser?: string[];
}

/**
 * Genererer syntetiske dokumenter når journalposten (ennå) ikke har dokumentmetadata fra API-et,
 * f.eks. rett etter journalføring. Markeres som ferdigstilt slik at de kan åpnes i PDF-fremviseren.
 */
function genererFallbackDokumenter(dokumentreferanse?: string, fallbackReferanser: string[] = []) {
    const unikeReferanser = Array.from(
        new Set([...(dokumentreferanse ? [dokumentreferanse] : []), ...fallbackReferanser]),
    );

    return unikeReferanser.map((referanse) => ({
        dokumentreferanse: referanse,
        status: DokumentStatusDto.FERDIGSTILT,
        metadata: {},
    }));
}

export default function JournalpostFremviser({
    journalpostId,
    dokumentreferanse,
    hidden,
    fallbackDokumentreferanser = [],
}: JournalpostFremviserProps) {
    const { data, isLoading: isLoadingJournalpost, error: journalpostError } = useHentJournalpost(journalpostId);

    const journalpost: JournalpostDto | undefined = data?.journalpost ?? undefined;

    // Journalposten slik den skal vises: samme struktur som resten av sakens dokumentvisning,
    // men begrenset til denne ene journalposten. Faller tilbake til syntetiske dokumenter
    // dersom API-et ennå ikke har returnert dokumentmetadata.
    const journalposterForVisning = useMemo<JournalpostDto[]>(() => {
        if (!journalpost) return [];

        const harDokumenter = (journalpost.dokumenter?.length ?? 0) > 0;
        if (harDokumenter) return [journalpost];

        return [
            {
                ...journalpost,
                dokumenter: genererFallbackDokumenter(dokumentreferanse, fallbackDokumentreferanser),
            },
        ];
    }, [journalpost, dokumentreferanse, fallbackDokumentreferanser]);

    const {
        data: dokumentData,
        filterState,
        menyState,
    } = useDokumentState(journalposterForVisning, {
        // Alltid vis journalposten uavhengig av ferdigstilt-status – det er den eneste vi har.
        standardKunFerdigstilte: false,
        initialDokumentreferanse: dokumentreferanse,
        autoSelectFirstDocument: true,
    });

    if (isLoadingJournalpost) {
        return (
            <VStack align="center" justify="center" style={{ height: "100vh" }}>
                <Loader size="3xlarge" title="Laster dokumentliste" />
            </VStack>
        );
    }

    if (journalpostError) throw journalpostError;

    if (!journalpost) return null;

    if (dokumentData.alleDokumenter.length === 0) {
        throw new Error(`Fant ingen dokumenter for journalpost ${journalpostId}`);
    }

    if (hidden) return null;

    async function opneSammenslattPdf(journalpostId: string) {
        const nyFane = window.open("", "_blank");
        if (!nyFane) return;

        try {
            const arrayBuffer = await hentDokumentApi({ journalpostId });
            const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });
            nyFane.location.href = URL.createObjectURL(pdfBlob);
        } catch {
            nyFane.close();
        }
    }

    const header = (
        <VStack gap="space-2">
            <JournalpostDetaljer journalpost={journalpost} />
            <JournalpostMetadata jp={journalpost} visFagomrade={false} />
            {dokumentData.alleDokumenter.length > 1 && (
                <Button variant="secondary" size="xsmall" onClick={() => opneSammenslattPdf(journalpostId)}>
                    Åpne sammenslått
                </Button>
            )}
        </VStack>
    );

    return (
        <DokumentVisning
            data={dokumentData}
            filterState={filterState}
            menyState={menyState}
            skjulKontroller
            flatDokumentliste
            venstreMenyHeader={header}
        />
    );
}
