import { DokumentFormatDto, type JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { HStack, VStack } from "@navikt/ds-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHentDokument, useHentDokumentMetadata, useHentDokumentUrl, useHentSak } from "~/api/useApi.ts";
import { estimatePageCountFromArrayBuffer, toPdfSource } from "~/common/components/utils/pdfUtils";
import type { PdfState } from "../types";
import {
    byggDokumenter,
    filtrerJournalposter,
    hentJournalpostIderMedFlereDokumenter,
    sjekkOmBlandingAvFarOgBidrag,
    utvidSettMedNyVerdi,
} from "../utils/saksdokumenterUtils";
import { PdfVisning } from "./PdfVisning";
import { ToppRad } from "./ToppRad";
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
    const harBlandingFarBid = useMemo(() => sjekkOmBlandingAvFarOgBidrag(journalposter), [journalposter]);

    const [visFarskapUtelukket, setVisFarskapUtelukket] = useState(false);
    const [visFeilregistrerte, setVisFeilregistrerte] = useState(false);
    const [kunVedtak, setKunVedtak] = useState(false);
    const [kunFerdigstilte, setKunFerdigstilte] = useState(false);

    // Ingen valgt som standard
    const [selectedId, setSelectedId] = useState<string>();
    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const createdBlobUrlRef = useRef<string | undefined>(undefined);
    const [viewerState, setViewerState] = useState<PdfState>({ loading: false });

    const filtrerteJournalposter = useMemo(
        () => filtrerJournalposter(journalposter, kunVedtak, visFarskapUtelukket, visFeilregistrerte, kunFerdigstilte),
        [journalposter, kunVedtak, visFarskapUtelukket, visFeilregistrerte, kunFerdigstilte],
    );

    const alleJpMedFlereDokumenter = useMemo(
        () => hentJournalpostIderMedFlereDokumenter(filtrerteJournalposter),
        [filtrerteJournalposter],
    );

    const dokumenter = useMemo(() => byggDokumenter(filtrerteJournalposter), [filtrerteJournalposter]);
    const selectedDocument = useMemo(() => dokumenter.find((d) => d.id === selectedId), [dokumenter, selectedId]);

    const gjelderMetadata = Boolean(selectedDocument?.kanAapnes && selectedDocument?.dokumentreferanse);

    const {
        data: metadata = [],
        isLoading: isMetadataLoading,
        error: metadataError,
    } = useHentDokumentMetadata(
        selectedDocument?.journalpostId ?? "",
        selectedDocument?.dokumentreferanse,
        gjelderMetadata,
    );

    const { mutateAsync: hentDokumentAsync } = useHentDokument();
    const { mutateAsync: hentDokumentUrlAsync } = useHentDokumentUrl();

    // Utvider accordion og oppdaterer visitedIds når brukeren eksplisitt velger et dokument
    useEffect(() => {
        if (selectedDocument?.journalpostId) {
            setExpandedIds((prev) => utvidSettMedNyVerdi(prev, selectedDocument.journalpostId));
        }
        if (selectedId) {
            setVisitedIds((prev) => utvidSettMedNyVerdi(prev, selectedId));
        }
    }, [selectedId, selectedDocument]);

    // Håndterer henting og åpning av valgt PDF
    useEffect(() => {
        const revokeBlob = () => {
            if (createdBlobUrlRef.current) {
                URL.revokeObjectURL(createdBlobUrlRef.current);
                createdBlobUrlRef.current = undefined;
            }
        };

        const handterDokumentApning = async () => {
            if (
                selectedDocument?.dokumentreferanse &&
                metadata.length === 1 &&
                metadata[0]?.format === DokumentFormatDto.MBDOK
            ) {
                const src = await hentDokumentUrlAsync({
                    journalpostId: selectedDocument.journalpostId,
                    dokumentreferanse: selectedDocument.dokumentreferanse,
                });
                setViewerState({ loading: false, src });
                return;
            }

            const res = await hentDokumentAsync({
                journalpostId: selectedDocument?.journalpostId ?? "",
                dokumentreferanse: selectedDocument?.dokumentreferanse,
            });
            const { src, pageBuffer, isBlobUrl } = toPdfSource(res);

            if (!src) {
                setViewerState({ loading: false, error: "Dokumentformat støttes ikke" });
                return;
            }

            if (isBlobUrl) {
                createdBlobUrlRef.current = src;
            }

            const pageCount = pageBuffer ? estimatePageCountFromArrayBuffer(pageBuffer) : undefined;
            setViewerState({ loading: false, src, pageCount });
        };

        if (!selectedDocument) {
            revokeBlob();
            setViewerState({ loading: false });
            return;
        }

        if (!selectedDocument.kanAapnes) {
            revokeBlob();
            setViewerState({ loading: false, error: selectedDocument.aapenForklaring ?? "Kan ikke åpnes" });
            return;
        }

        if (gjelderMetadata && isMetadataLoading) {
            setViewerState({ loading: true });
            return;
        }

        revokeBlob();
        setViewerState({ loading: true });

        handterDokumentApning().catch((err) =>
            setViewerState({ loading: false, error: err instanceof Error ? err.message : String(err) }),
        );

        return () => revokeBlob();
    }, [selectedDocument, metadata, gjelderMetadata, isMetadataLoading, hentDokumentAsync, hentDokumentUrlAsync]);

    if (metadataError) {
        throw metadataError;
    }

    return (
        <VStack gap="space-16" style={{ height: "100%", overflow: "hidden" }}>
            <ToppRad saksnummer={saksnummer} selectedDocument={selectedDocument} sakRoller={sakRoller} />
            <HStack gap="space-16" align="start" style={{ flex: 1, overflow: "hidden" }}>
                <VenstreMeny
                    journalposter={filtrerteJournalposter}
                    dokumenter={dokumenter}
                    sakRoller={sakRoller}
                    harBlandingFarBid={harBlandingFarBid}
                    kunVedtak={kunVedtak}
                    setKunVedtak={setKunVedtak}
                    visFarskapUtelukket={visFarskapUtelukket}
                    setVisFarskapUtelukket={setVisFarskapUtelukket}
                    visFeilregistrerte={visFeilregistrerte}
                    setVisFeilregistrerte={setVisFeilregistrerte}
                    kunFerdigstilte={kunFerdigstilte}
                    setKunFerdigstilte={setKunFerdigstilte}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    visitedIds={visitedIds}
                    expandedIds={expandedIds}
                    setExpandedIds={setExpandedIds}
                    alleJpMedFlereDokumenter={alleJpMedFlereDokumenter}
                />
                <PdfVisning
                    selectedDocument={selectedDocument}
                    viewerState={viewerState}
                    isMetadataLoading={isMetadataLoading}
                />
            </HStack>
        </VStack>
    );
}
