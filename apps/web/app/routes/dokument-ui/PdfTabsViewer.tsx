import type { DokumentMetadata } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { Alert, BodyShort, Button, Detail, Heading, Label, List, Loader } from "@navikt/ds-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHentDokument, useHentDokumentMetadata } from "~/api/useApi.ts";
import { estimatePageCountFromArrayBuffer, toPdfSource } from "~/common/components/utils/pdfUtils";

interface PdfTabsViewerProps {
    journalpostId: string;
    dokumentreferanse?: string;
    resizeToA4?: boolean;
    optimizeForPrint?: boolean;
    hidden?: boolean;
    openInNewTab?: boolean;
    fallbackDokumentreferanser?: string[];
}

interface PdfDocumentState {
    src?: string;
    loading: boolean;
    error?: string;
    pageCount?: number;
}

interface DokumentMetadataView {
    tittel?: string | null;
    journalpostId?: string | null;
    dokumentreferanse: string;
    status?: DokumentStatusDto | null;
}

function getDocumentTitle(dokument: DokumentMetadataView): string {
    return dokument.tittel?.trim() || dokument.dokumentreferanse;
}

function formatSidebarLabel(dokument: DokumentMetadataView, index: number): string {
    return `${index + 1}. ${getDocumentTitle(dokument)}`;
}

function toViewMetadata(metadataList: DokumentMetadata[]): DokumentMetadataView[] {
    return metadataList
        .filter((metadata): metadata is DokumentMetadata & { dokumentreferanse: string } =>
            Boolean(metadata.dokumentreferanse),
        )
        .map((metadata) => ({
            tittel: metadata.tittel,
            journalpostId: metadata.journalpostId,
            dokumentreferanse: metadata.dokumentreferanse,
            status: metadata.status,
        }));
}

export default function PdfTabsViewer({
    journalpostId,
    dokumentreferanse,
    resizeToA4,
    optimizeForPrint,
    hidden,
    openInNewTab,
    fallbackDokumentreferanser = [],
}: PdfTabsViewerProps) {
    const [selectedValue, setSelectedValue] = useState<string>();
    const [loadedDocuments, setLoadedDocuments] = useState<Record<string, PdfDocumentState>>({});

    const createdBlobUrlsRef = useRef<string[]>([]);
    const inFlightDocumentsRef = useRef<Set<string>>(new Set());
    const hasAutoFocusedSidebarRef = useRef(false);
    const listRef = useRef<HTMLDivElement>(null);

    const {
        data: metadata = [],
        isLoading: isLoadingMetadata,
        error: metadataError,
    } = useHentDokumentMetadata(journalpostId, undefined);
    const { mutateAsync: hentDokumentAsync } = useHentDokument();
    const dokumenter = useMemo(() => {
        const metadataDokumenter = toViewMetadata(metadata);
        if (metadataDokumenter.length > 0) {
            return metadataDokumenter;
        }

        const fallbackReferanser = Array.from(
            new Set([...(dokumentreferanse ? [dokumentreferanse] : []), ...fallbackDokumentreferanser]),
        );

        return fallbackReferanser.map((referanse) => ({
            dokumentreferanse: referanse,
            journalpostId,
            tittel: referanse,
            status: undefined,
        }));
    }, [dokumentreferanse, fallbackDokumentreferanser, journalpostId, metadata]);
    const selectedDocument = useMemo(
        () => dokumenter.find((dokument) => dokument.dokumentreferanse === selectedValue),
        [dokumenter, selectedValue],
    );
    const showMergedButton = dokumenter.length > 1;

    const selectDocumentByIndex = (index: number) => {
        if (index < 0 || index >= dokumenter.length) {
            return;
        }

        const documentToSelect = dokumenter[index];
        if (!documentToSelect) {
            return;
        }
        setSelectedValue(documentToSelect.dokumentreferanse);

        const button = listRef.current?.querySelector<HTMLButtonElement>(
            `button[data-dokumentreferanse="${documentToSelect.dokumentreferanse}"]`,
        );
        button?.focus();
    };

    const onListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
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

    useEffect(() => {
        hasAutoFocusedSidebarRef.current = false;
        setLoadedDocuments({});
    }, [journalpostId, dokumentreferanse]);

    useEffect(() => {
        if (!selectedValue || hasAutoFocusedSidebarRef.current) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            const button = listRef.current?.querySelector<HTMLButtonElement>(
                `button[data-dokumentreferanse="${selectedValue}"]`,
            );
            if (button) {
                button.focus();
                hasAutoFocusedSidebarRef.current = true;
            }
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [selectedValue]);

    useEffect(() => {
        if (!selectedDocument) {
            return;
        }

        const dokumentreferanseValue = selectedDocument.dokumentreferanse;
        const state = loadedDocuments[dokumentreferanseValue];
        if (state?.src || state?.error || state?.loading || inFlightDocumentsRef.current.has(dokumentreferanseValue)) {
            return;
        }

        if (selectedDocument.status === DokumentStatusDto.UNDER_PRODUKSJON) {
            return;
        }

        inFlightDocumentsRef.current.add(dokumentreferanseValue);
        setLoadedDocuments((current) => ({
            ...current,
            [dokumentreferanseValue]: { loading: true },
        }));

        hentDokumentAsync({
            journalpostId: selectedDocument.journalpostId || journalpostId,
            dokumentreferanse: selectedDocument.dokumentreferanse,
            resizeToA4,
            optimizeForPrint,
        })
            .then((response: unknown) => {
                const { src, pageBuffer, isBlobUrl } = toPdfSource(response);
                if (!src) {
                    setLoadedDocuments((current) => ({
                        ...current,
                        [dokumentreferanseValue]: {
                            loading: false,
                            error: "Dokumentformat støttes ikke i innebygd visning",
                        },
                    }));
                    return;
                }

                if (isBlobUrl) {
                    createdBlobUrlsRef.current.push(src);
                }

                const pageCount = pageBuffer ? estimatePageCountFromArrayBuffer(pageBuffer) : undefined;
                setLoadedDocuments((current) => ({
                    ...current,

                    [dokumentreferanseValue]: { loading: false, src, pageCount },
                }));
            })
            .catch(() => {
                setLoadedDocuments((current) => ({
                    ...current,
                    [dokumentreferanseValue]: {
                        loading: false,
                        error: "Kunne ikke hente dokument",
                    },
                }));
            })
            .finally(() => {
                inFlightDocumentsRef.current.delete(dokumentreferanseValue);
            });
    }, [selectedDocument, loadedDocuments, journalpostId, resizeToA4, optimizeForPrint, hentDokumentAsync]);

    useEffect(() => {
        if (dokumenter.length === 0) {
            setSelectedValue(undefined);
            return;
        }

        const valgtDokumentreferanse =
            dokumentreferanse &&
            dokumenter.some(
                (dokument) =>
                    dokument.dokumentreferanse === dokumentreferanse &&
                    dokument.status !== DokumentStatusDto.UNDER_PRODUKSJON,
            )
                ? dokumentreferanse
                : dokumenter.find((dokument) => dokument.status !== DokumentStatusDto.UNDER_PRODUKSJON)
                      ?.dokumentreferanse;

        setSelectedValue((current) => {
            const currentIsValid =
                current &&
                dokumenter.some(
                    (dokument) =>
                        dokument.dokumentreferanse === current &&
                        dokument.status !== DokumentStatusDto.UNDER_PRODUKSJON,
                );
            return currentIsValid ? current : valgtDokumentreferanse;
        });
    }, [dokumenter, dokumentreferanse]);

    useEffect(() => {
        return () => {
            createdBlobUrlsRef.current.forEach((url) => {
                URL.revokeObjectURL(url);
            });
        };
    }, []);

    const openMergedDocument = () => {
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

    if (isLoadingMetadata) {
        return (
            <div style={{ marginTop: "3rem", display: hidden ? "none" : "block" }}>
                <Loader size="3xlarge" title="Laster dokumentliste" />
            </div>
        );
    }

    if (metadataError) {
        throw metadataError;
    }

    if (dokumenter.length === 0) {
        throw new Error(`Fant ingen dokumenter for journalpost ${journalpostId}`);
    }

    return (
        <div
            style={{
                display: hidden ? "none" : "flex",
                height: "100vh",
                maxHeight: "100vh",
                overflow: "hidden",
            }}
        >
            <nav
                aria-label="Dokumentliste"
                style={{
                    width: "21rem",
                    minWidth: "16rem",
                    borderRight: "1px solid var(--a-border-default)",
                    background: "var(--a-surface-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "1rem",
                        borderBottom: "1px solid var(--a-border-default)",
                        background: "var(--a-surface-default)",
                    }}
                >
                    <Label size="small" style={{ color: "var(--a-text-subtle)", marginBottom: "0.25rem" }}>
                        Dokumentliste
                    </Label>
                    <Heading size="small" spacing={false}>
                        Journalpost {journalpostId}
                    </Heading>
                    <BodyShort size="small" style={{ color: "var(--a-text-subtle)", marginTop: "0.25rem" }}>
                        {dokumenter.length} dokumenter
                    </BodyShort>
                    <BodyShort size="small" style={{ color: "var(--a-text-subtle)", marginTop: "0.25rem" }}>
                        Tips: Klikk først i dokumentlisten under. Deretter kan du bruke pil opp og pil ned for å bytte
                        dokument.
                    </BodyShort>
                    {showMergedButton && (
                        <div style={{ marginTop: "0.75rem" }}>
                            <Button variant="secondary" size="xsmall" onClick={openMergedDocument}>
                                Åpne sammenslått
                            </Button>
                        </div>
                    )}
                </div>

                <div
                    ref={listRef}
                    role="listbox"
                    aria-label="Velg dokument"
                    onKeyDown={onListKeyDown}
                    style={{
                        margin: 0,
                        padding: "0.5rem",
                        overflowY: "auto",
                        overflowX: "hidden",
                        overscrollBehavior: "contain",
                        flex: 1,
                    }}
                >
                    <List as="ol" size="small" className={"[&_ol]:p-0"} style={{ margin: 0, padding: 0 }}>
                        {dokumenter.map((dokument, index) => {
                            const state = loadedDocuments[dokument.dokumentreferanse];
                            const isSelected = selectedValue === dokument.dokumentreferanse;
                            const erUnderProduksjon = dokument.status === DokumentStatusDto.UNDER_PRODUKSJON;

                            return (
                                <List.Item
                                    key={dokument.dokumentreferanse}
                                    role="option"
                                    aria-selected={isSelected}
                                    style={{ marginBottom: "0.5rem", listStyleType: "none" }}
                                >
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="small"
                                        onClick={() =>
                                            !erUnderProduksjon && setSelectedValue(dokument.dokumentreferanse)
                                        }
                                        disabled={erUnderProduksjon}
                                        tabIndex={isSelected ? 0 : -1}
                                        data-dokumentreferanse={dokument.dokumentreferanse}
                                        aria-current={isSelected ? "true" : "false"}
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            border: "1px solid var(--a-border-subtle)",
                                            borderRadius: "0.5rem",
                                            borderLeft: isSelected
                                                ? "3px solid var(--a-blue-500)"
                                                : "3px solid transparent",
                                            background: isSelected ? "var(--a-blue-50)" : "var(--a-surface-default)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.25rem",
                                            justifyContent: "flex-start",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <Label
                                            size="small"
                                            style={{
                                                fontWeight: isSelected ? 600 : 400,
                                                wordBreak: "break-word",
                                                color: erUnderProduksjon
                                                    ? "var(--a-text-subtle)"
                                                    : "var(--a-text-default)",
                                            }}
                                        >
                                            {formatSidebarLabel(dokument, index)}
                                        </Label>
                                        {erUnderProduksjon && (
                                            <Detail style={{ color: "var(--a-text-subtle)" }}>Under produksjon</Detail>
                                        )}
                                        {!erUnderProduksjon && state?.pageCount && (
                                            <Detail style={{ color: "var(--a-text-subtle)" }}>
                                                {state.pageCount} sider
                                            </Detail>
                                        )}
                                        {!erUnderProduksjon && state?.loading && (
                                            <Detail style={{ color: "var(--a-text-subtle)" }}>Laster...</Detail>
                                        )}
                                        {!erUnderProduksjon && state?.error && (
                                            <Detail style={{ color: "var(--a-text-danger)" }}>Feil ved lasting</Detail>
                                        )}
                                    </Button>
                                </List.Item>
                            );
                        })}
                    </List>
                </div>
            </nav>

            <div
                style={{
                    flex: 1,
                    overflow: "hidden",
                    padding: "1rem",
                    boxSizing: "border-box",
                }}
            >
                {dokumenter.map((dokument) => {
                    const state = loadedDocuments[dokument.dokumentreferanse];
                    const isSelected = selectedValue === dokument.dokumentreferanse;

                    return (
                        <div
                            key={dokument.dokumentreferanse}
                            style={{ display: isSelected ? "block" : "none", height: "100%" }}
                        >
                            {state?.loading && <Loader size="xlarge" title="Laster dokument" />}
                            {!state?.loading && state?.error && <Alert variant="error">{state.error}</Alert>}
                            {!state?.loading && !state?.error && state?.src && (
                                <iframe
                                    title={getDocumentTitle(dokument)}
                                    src={state.src}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: "1px solid var(--a-border-default)",
                                        borderRadius: "4px",
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
