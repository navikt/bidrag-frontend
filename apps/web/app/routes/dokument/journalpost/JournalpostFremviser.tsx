import type { DokumentDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { EyeIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Button, Detail, HStack, Label, List, Loader, VStack } from "@navikt/ds-react";
import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { hentDokumentApi, useHentJournalpost } from "~/api/useApi.ts";
import { toPdfSource } from "~/common/components/utils/pdfUtils";
import { PdfVisning } from "~/common/dokument/PdfVisning";
import { JournalpostDetaljer } from "./JournalpostDetaljer";

interface JournalpostFremviserProps {
    journalpostId: string;
    dokumentreferanse?: string;
    resizeToA4?: boolean;
    optimizeForPrint?: boolean;
    hidden?: boolean;
    openInNewTab?: boolean;
    fallbackDokumentreferanser?: string[];
}

interface DokumentView {
    tittel?: string | null;
    journalpostId?: string | null;
    dokumentreferanse: string;
    status?: DokumentStatusDto | string | null;
}

function getDocumentTitle(dokument: DokumentView): string {
    const hasTitle = Boolean(dokument.tittel?.trim());
    if (hasTitle) return dokument.tittel as string;
    return "Dokument uten tittel";
}

function formatSidebarLabel(dokument: DokumentView, index: number): string {
    return `${index + 1}. ${getDocumentTitle(dokument)}`;
}

function mapDokumenterToView(dokumenter: DokumentDto[] = []): DokumentView[] {
    const medReferanse = dokumenter.filter((dok) => Boolean(dok.dokumentreferanse));
    return medReferanse.map((dok) => ({
        tittel: dok.tittel,
        journalpostId: dok.journalpostId,
        dokumentreferanse: dok.dokumentreferanse as string,
        status: dok.status,
    }));
}

function generateFallbackDocuments(
    journalpostId: string,
    dokumentreferanse?: string,
    fallbackReferanser: string[] = [],
): DokumentView[] {
    const unikeReferanser = Array.from(
        new Set([...(dokumentreferanse ? [dokumentreferanse] : []), ...fallbackReferanser]),
    );
    return unikeReferanser.map((referanse) => ({
        dokumentreferanse: referanse,
        journalpostId,
        tittel: null,
        status: undefined,
    }));
}

function DocumentPdfViewer({
    journalpostId,
    dokumentreferanse,
    tittel,
    isSelected,
    resizeToA4,
    optimizeForPrint,
}: {
    journalpostId: string;
    dokumentreferanse: string;
    tittel: string;
    isSelected: boolean;
    resizeToA4?: boolean;
    optimizeForPrint?: boolean;
}) {
    const {
        data: arrayBuffer,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["hent_dokument_pdf", journalpostId, dokumentreferanse, resizeToA4, optimizeForPrint],
        queryFn: () => hentDokumentApi({ journalpostId, dokumentreferanse, resizeToA4, optimizeForPrint }),
        enabled: isSelected,
        staleTime: 1000 * 60 * 60,
    });

    const pdfSource = useMemo(() => {
        if (!arrayBuffer) return null;
        return toPdfSource(arrayBuffer);
    }, [arrayBuffer]);

    useEffect(
        function cleanupBlobUrl() {
            return () => {
                if (pdfSource?.isBlobUrl && pdfSource.src) {
                    URL.revokeObjectURL(pdfSource.src);
                }
            };
        },
        [pdfSource],
    );

    if (!isSelected) return null;
    if (!pdfSource?.src) return <Alert variant="error">Dokumentformat støttes ikke i innebygd visning</Alert>;

    return (
        <PdfVisning title={tittel} viewerState={{ src: pdfSource.src, loading: isLoading, error: error?.message }} />
    );
}

export default function JournalpostFremviser({
    journalpostId,
    dokumentreferanse,
    resizeToA4,
    optimizeForPrint,
    hidden,
    openInNewTab,
    fallbackDokumentreferanser = [],
}: JournalpostFremviserProps) {
    const [selectedValue, setSelectedValue] = useState<string>();
    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
    const hasAutoFocusedSidebarRef = useRef(false);
    const listRef = useRef<HTMLDivElement>(null);

    const {
        data: journalpostResponse,
        isLoading: isLoadingJournalpost,
        error: journalpostError,
    } = useHentJournalpost(journalpostId);

    const dokumenter = useMemo(() => {
        const apiDokumenter = mapDokumenterToView(journalpostResponse?.journalpost?.dokumenter);
        if (apiDokumenter.length > 0) return apiDokumenter;
        return generateFallbackDocuments(journalpostId, dokumentreferanse, fallbackDokumentreferanser);
    }, [dokumentreferanse, fallbackDokumentreferanser, journalpostId, journalpostResponse]);

    const showMergedButton = dokumenter.length > 1;

    const selectDocumentByIndex = (index: number) => {
        const documentToSelect = dokumenter[index];
        if (!documentToSelect) return;

        setSelectedValue(documentToSelect.dokumentreferanse);

        const button = listRef.current?.querySelector<HTMLButtonElement>(
            `button[data-dokumentreferanse="${documentToSelect.dokumentreferanse}"]`,
        );
        button?.focus();
    };

    const handleListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const currentIndex = dokumenter.findIndex((dokument) => dokument.dokumentreferanse === selectedValue);

        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectDocumentByIndex(Math.min(currentIndex + 1, dokumenter.length - 1));
            return;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            selectDocumentByIndex(Math.max(currentIndex - 1, 0));
            return;
        }
        if (event.key === "Home") {
            event.preventDefault();
            selectDocumentByIndex(0);
            return;
        }
        if (event.key === "End") {
            event.preventDefault();
            selectDocumentByIndex(dokumenter.length - 1);
        }
    };

    useEffect(
        function resetSidebarFocusState() {
            hasAutoFocusedSidebarRef.current = false;
        },
        [journalpostId, dokumentreferanse],
    );

    useEffect(
        function trackVisitedAndFocusSidebar() {
            if (!selectedValue) return;

            setVisitedIds((prev) => new Set(prev).add(selectedValue));

            if (hasAutoFocusedSidebarRef.current) return;

            const frame = window.requestAnimationFrame(() => {
                const button = listRef.current?.querySelector<HTMLButtonElement>(
                    `button[data-dokumentreferanse="${selectedValue}"]`,
                );
                if (!button) return;

                button.focus();
                hasAutoFocusedSidebarRef.current = true;
            });

            return () => window.cancelAnimationFrame(frame);
        },
        [selectedValue],
    );

    useEffect(
        function autoSelectInitialDocument() {
            if (dokumenter.length === 0) {
                setSelectedValue(undefined);
                return;
            }

            const isRequestedDocumentReady =
                dokumentreferanse &&
                dokumenter.some(
                    (dokument) =>
                        dokument.dokumentreferanse === dokumentreferanse &&
                        dokument.status !== DokumentStatusDto.UNDER_PRODUKSJON,
                );

            const fallbackReferanse = dokumenter.find(
                (dokument) => dokument.status !== DokumentStatusDto.UNDER_PRODUKSJON,
            )?.dokumentreferanse;

            const valgtDokumentreferanse = isRequestedDocumentReady ? dokumentreferanse : fallbackReferanse;

            setSelectedValue((current) => {
                const isCurrentReady =
                    current &&
                    dokumenter.some(
                        (dokument) =>
                            dokument.dokumentreferanse === current &&
                            dokument.status !== DokumentStatusDto.UNDER_PRODUKSJON,
                    );
                return isCurrentReady ? current : valgtDokumentreferanse;
            });
        },
        [dokumenter, dokumentreferanse],
    );

    const handleOpenMergedDocument = () => {
        const url = new URL(`/aapnedokument/${journalpostId}/${dokumentreferanse ?? ""}`, window.location.origin);
        const query = new URLSearchParams(window.location.search);
        query.set("visningstype", "single");
        url.search = query.toString();

        if (openInNewTab) {
            window.open(url.toString(), "_blank");
            return;
        }
        window.location.assign(url.toString());
    };

    if (hidden) return null;

    if (isLoadingJournalpost) {
        return (
            <VStack align="center" justify="center" style={{ height: "100vh" }}>
                <Loader size="3xlarge" title="Laster dokumentliste" />
            </VStack>
        );
    }

    if (journalpostError) throw journalpostError;
    if (dokumenter.length === 0) throw new Error(`Fant ingen dokumenter for journalpost ${journalpostId}`);

    return (
        <HStack wrap={false} style={{ height: "100vh", overflow: "hidden" }}>
            <VStack
                as="nav"
                aria-label="Dokumentliste"
                style={{ width: "21rem", minWidth: "16rem", maxWidth: "30em", overflow: "hidden" }}
            >
                <VStack gap="space-4">
   

                    <JournalpostDetaljer journalpost={journalpostResponse?.journalpost} />

                    {dokumenter.length > 1 && (
                        <>
                            <BodyShort size="small" textColor="subtle">
                                {dokumenter.length} dokumenter
                            </BodyShort>
                            <BodyShort size="small" textColor="subtle">
                                Tips: Klikk først i dokumentlisten under. Deretter kan du bruke pil opp og pil ned for å
                                bytte dokument.
                            </BodyShort>
                        </>
                    )}

                    {showMergedButton && (
                        <Button
                            variant="secondary"
                            size="xsmall"
                            onClick={handleOpenMergedDocument}
                            style={{ marginTop: "var(--a-spacing-3)" }}
                        >
                            Åpne sammenslått
                        </Button>
                    )}
                </VStack>

                <div
                    ref={listRef}
                    role="listbox"
                    aria-label="Velg dokument"
                    onKeyDown={handleListKeyDown}
                    style={{
                        padding: "var(--a-spacing-2)",
                        overflowY: "auto",
                        overflowX: "hidden",
                        overscrollBehavior: "contain",
                        flex: 1,
                    }}
                >
                    <List as="ol" size="small">
                        {dokumenter.map((dokument, index) => {
                            const isSelected = selectedValue === dokument.dokumentreferanse;
                            const isUnderProduksjon = dokument.status === DokumentStatusDto.UNDER_PRODUKSJON;
                            const isVisited = visitedIds.has(dokument.dokumentreferanse);

                            return (
                                <List.Item
                                    key={dokument.dokumentreferanse}
                                    role="option"
                                    aria-selected={isSelected}
                                    style={{ listStyle: "none" }}
                                >
                                    <HStack align="center" gap="space-2" wrap={false}>
                                        <Button
                                            type="button"
                                            variant="tertiary"
                                            size="small"
                                            onClick={() =>
                                                !isUnderProduksjon && setSelectedValue(dokument.dokumentreferanse)
                                            }
                                            disabled={isUnderProduksjon}
                                            tabIndex={isSelected ? 0 : -1}
                                            data-dokumentreferanse={dokument.dokumentreferanse}
                                            aria-current={isSelected ? "true" : "false"}
                                            style={{
                                                flex: 1,
                                                justifyContent: "flex-start",
                                                textAlign: "left",
                                                backgroundColor: isSelected
                                                    ? "var(--a-surface-action-subtle)"
                                                    : "var(--a-surface-default)",
                                                borderRadius: "var(--a-border-radius-medium)",
                                            }}
                                        >
                                            <VStack style={{ overflow: "hidden" }}>
                                                <Label
                                                    size="small"
                                                    textColor={isUnderProduksjon ? "subtle" : "default"}
                                                    style={{ wordBreak: "break-word" }}
                                                >
                                                    {formatSidebarLabel(dokument, index)}
                                                </Label>
                                                {isUnderProduksjon && (
                                                    <Detail textColor="subtle">Under produksjon</Detail>
                                                )}
                                            </VStack>
                                        </Button>

                                        {isVisited && (
                                            <EyeIcon
                                                title="Sett"
                                                aria-label="Sett"
                                                style={{ color: "var(--a-icon-subtle)", flexShrink: 0 }}
                                            />
                                        )}
                                    </HStack>
                                </List.Item>
                            );
                        })}
                    </List>
                </div>
            </VStack>

            <div style={{ flex: 1, overflow: "hidden" }}>
                {dokumenter.map((dokument) => (
                    <div
                        key={dokument.dokumentreferanse}
                        style={{
                            height: "100%",
                            display: selectedValue === dokument.dokumentreferanse ? "block" : "none",
                        }}
                    >
                        <DocumentPdfViewer
                            journalpostId={dokument.journalpostId || journalpostId}
                            dokumentreferanse={dokument.dokumentreferanse}
                            tittel={getDocumentTitle(dokument)}
                            isSelected={selectedValue === dokument.dokumentreferanse}
                            resizeToA4={resizeToA4}
                            optimizeForPrint={optimizeForPrint}
                        />
                    </div>
                ))}
            </div>
        </HStack>
    );
}
