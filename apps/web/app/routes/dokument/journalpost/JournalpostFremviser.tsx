import { BIDRAG_DOKUMENT_API } from "@bidrag/api";
import type { DokumentDto, JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentFormatDto, DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { OpenDocumentUtils } from "@bidrag/common";
import { Button, Loader, VStack } from "@navikt/ds-react";
import { useEffect, useMemo, useRef } from "react";
import { hentDokumentApi, hentDokumentUrlApi, useHentJournalpost } from "~/api/useApi.ts";
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

function erUnderProduksjon(dokument?: DokumentDto) {
    return (
        dokument?.status === DokumentStatusDto.UNDER_PRODUKSJON ||
        dokument?.status === DokumentStatusDto.UNDER_REDIGERING
    );
}

/**
 * Dokumenter under produksjon i MBDOK kan ikke vises i PDF-fremviseren. De åpnes i stedet i
 * brevklienten, og fanen som ble åpnet for fremviseren lukkes etterpå.
 */
async function åpneIMbdokOgLukkVindu(journalpostId: string, dokumentreferanse: string) {
    const metadataResponse = await BIDRAG_DOKUMENT_API.dokument.hentDokumentMetadataGet1(
        journalpostId,
        dokumentreferanse,
    );
    if (metadataResponse.data[0]?.format !== DokumentFormatDto.MBDOK) return false;

    const dokumentUrl = await hentDokumentUrlApi({ journalpostId, dokumentreferanse });
    OpenDocumentUtils.openDocumentExternal(dokumentUrl);
    setTimeout(() => window.close(), 400);
    return true;
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

    const mbdokÅpnetRef = useRef(false);

    useEffect(() => {
        if (mbdokÅpnetRef.current || !journalpost) return;

        const dokumenter = journalpost.dokumenter ?? [];
        const dokument = dokumentreferanse
            ? dokumenter.find((dok) => dok.dokumentreferanse === dokumentreferanse)
            : dokumenter[0];

        const referanse = dokument?.dokumentreferanse ?? dokumentreferanse;
        if (!erUnderProduksjon(dokument) || !referanse) return;

        mbdokÅpnetRef.current = true;
        åpneIMbdokOgLukkVindu(journalpostId, referanse).catch(() => {
            mbdokÅpnetRef.current = false;
        });
    }, [journalpost, journalpostId, dokumentreferanse]);

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
