import { EditorConfigStorage, FileUtils, LoggerService, objectsDeepEqual, queryParams } from "@bidrag/common";
import React, { type PropsWithChildren, useContext, useEffect, useRef, useState } from "react";

import StateHistory from "../../../components/history/StateHistory";
import { MaskingContainer, useMaskingContainer } from "../../../components/masking/MaskingContainer";
import { TimerUtils } from "../../../components/utils/TimerUtils";
import type { PdfDocumentType } from "../../../components/utils/types";
import { type IProducerProgress, PdfProducer } from "../../../pdf/PdfProducer";
import type { ClosingWindow, EditDocumentMetadata, IDocumentMetadata } from "../../../types/EditorTypes";

export type PdfEditorMode = "view_only_unlockable" | "edit" | "remove_pages_only" | "view_only_locked";

type ProduceAndSaveState = "PRODUCING" | "SAVING_DOCUMENT" | "SAVING_METADATA" | "IDLE" | "ERROR" | "CLOSING_WINDOW";
interface IProduceAndSaveDocumentProgress {
    state: ProduceAndSaveState;
    progress?: number;
}
interface PdfEditorContextProps {
    mode: PdfEditorMode;
    produceAndSaveProgress: IProduceAndSaveDocumentProgress;
    hasUnsavedChanges: boolean;
    totalPages: number;
    history: StateHistory<EditDocumentMetadata>;
    removedPages: number[];
    maskedPagesCount: number;
    maskedPageNumbers: number[];
    maskItemsCount: number;
    maskItemsByPage: Record<number, number>;
    pageRotations: Record<number, number>;
    toggleDeletedPage: (page: number) => void;
    rotatePage: (pageNumber: number, direction: "LEFT" | "RIGHT") => void;
    savePdf: (closeAfterSave?: boolean) => Promise<ClosingWindow>;
    previewPdf: () => Promise<void>;
    previewOriginalPdf: () => Promise<void>;
    finishPdf: () => Promise<ClosingWindow>;
    onToggleSidebar: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onInit: (totalPages: number, pageRefs: string[]) => void;
    isAllowedToDeletePage: () => boolean;
    hideSidebar: () => void;
    forsendelseId: string;
    sidebarHidden: boolean;
    isSavingEditDocumentConfig: boolean;
    dokumentreferanse: string;
    dokumentMetadata?: IDocumentMetadata<EditDocumentMetadata>;
}

export const usePdfEditorContext = () => useContext(PdfEditorContext);
export const PdfEditorContext = React.createContext<PdfEditorContextProps>({} as PdfEditorContextProps);
export type SaveState = "PENDING" | "ERROR" | "IDLE";
interface IPdfEditorContextProviderProps {
    mode: PdfEditorMode;
    submitOnSave?: boolean;
    journalpostId: string;
    dokumentreferanse: string;
    dokumentMetadata?: IDocumentMetadata<EditDocumentMetadata>;
    documentFile: PdfDocumentType;
    onSave?: (config: EditDocumentMetadata) => Promise<ClosingWindow>;
    onSaveAndClose?: (config: EditDocumentMetadata) => Promise<ClosingWindow>;
    onSubmit?: (config: EditDocumentMetadata, document: Uint8Array) => Promise<ClosingWindow>;
}

export default function PdfEditorContextProvider(props: PropsWithChildren<IPdfEditorContextProviderProps>) {
    const items = props.dokumentMetadata?.editorMetadata?.items ?? [];
    const isEditMode = props.mode == "edit";
    return (
        <MaskingContainer items={isEditMode ? items : []} enabled={isEditMode}>
            <PdfEditorContextProviderWithMasking {...props} />
        </MaskingContainer>
    );
}

function PdfEditorContextProviderWithMasking({
    journalpostId,
    mode,
    dokumentreferanse,
    dokumentMetadata,
    documentFile,
    submitOnSave,
    onSave,
    onSaveAndClose,
    onSubmit,
    children,
}: PropsWithChildren<IPdfEditorContextProviderProps>) {
    const { items, initItems } = useMaskingContainer();
    const [produceAndSaveProgress, setProduceAndSaveProgress] = useState<IProduceAndSaveDocumentProgress>({
        state: "IDLE",
    });
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [removedPages, setRemovedPages] = useState<number[]>(getInitialRemovedPages());
    const [pageRotations, setPageRotations] = useState<Record<number, number>>(getInitialPageRotations());
    const totalPages = useRef(-1);
    // The exact PDF object refs pdfjs-dist resolved for each page, in the order the user sees
    // them in the editor. Passed to PdfProducer as the ground-truth page order so it doesn't
    // have to re-derive its own (potentially different) recovery order for corrupt PDFs.
    const editorPageRefOrder = useRef<string[]>([]);
    const [lastSavedData, setLastSavedData] = useState(getEditDocumentMetadata());
    const [history, setHistory] = useState(new StateHistory<EditDocumentMetadata>(getEditDocumentMetadata()));
    const [isSavingEditDocumentConfig, setIsSavingDocumentConfig] = useState(false);
    const saveChanges = useRef(TimerUtils.debounce(onSaveChanges, 500));
    const isUndoRedoChange = useRef(false);
    const divRef = useRef<HTMLDivElement>(null);
    const allowWindowCloseRef = useRef(false);
    const savingDocumentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inFlightProcessedPdf = useRef<Promise<{ documentFile: Uint8Array; config: EditDocumentMetadata }> | null>(
        null,
    );

    useEffect(() => divRef.current.focus(), []);
    useEffect(() => {
        const hasChanged = !objectsDeepEqual(history.current, getEditDocumentMetadata());
        if (!isUndoRedoChange.current && hasChanged) {
            setHistory((prevHistory) => prevHistory.push(getEditDocumentMetadata()));
        }
        isUndoRedoChange.current = false;
    }, [items, removedPages, pageRotations, history]);

    useEffect(() => {
        const hasChanged = !objectsDeepEqual(lastSavedData, getEditDocumentMetadata());
        if (hasChanged) {
            saveChanges.current(getEditDocumentMetadata());
        }
    }, [items, removedPages, pageRotations]);

    const hasUnsavedChanges = !objectsDeepEqual(lastSavedData, getEditDocumentMetadata());
    const persistedMaskItems = items.filter((item) => item.state == "ITEM" || item.state == undefined);
    const maskItemsByPage = persistedMaskItems.reduce(
        (acc, item) => {
            acc[item.pageNumber] = (acc[item.pageNumber] ?? 0) + 1;
            return acc;
        },
        {} as Record<number, number>,
    );
    const maskedPageNumbers = Object.keys(maskItemsByPage)
        .map(Number)
        .sort((a, b) => a - b);
    const maskedPagesCount = new Set(persistedMaskItems.map((item) => item.pageNumber)).size;
    const maskItemsCount = persistedMaskItems.length;

    useEffect(() => {
        function handleBeforeUnload(event: BeforeUnloadEvent) {
            if (allowWindowCloseRef.current) {
                return;
            }

            const isSavingInProgress =
                produceAndSaveProgress.state === "SAVING_METADATA" ||
                produceAndSaveProgress.state === "SAVING_DOCUMENT" ||
                produceAndSaveProgress.state === "PRODUCING";

            if (hasUnsavedChanges || isSavingEditDocumentConfig || isSavingInProgress) {
                event.preventDefault();
                event.returnValue = "";
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges, isSavingEditDocumentConfig, produceAndSaveProgress.state]);

    useEffect(() => {
        return () => {
            if (savingDocumentTimerRef.current) {
                clearTimeout(savingDocumentTimerRef.current);
                savingDocumentTimerRef.current = null;
            }
        };
    }, []);

    function updateSaveState(state: ProduceAndSaveState, progress?: number) {
        setProduceAndSaveProgress({
            state,
            progress,
        });
    }
    function onSaveChanges(editDocumentMetadata: EditDocumentMetadata) {
        updateSaveState("SAVING_METADATA");
        return savePdf(editDocumentMetadata)
            .then(() => updateSaveState("IDLE"))
            .catch((e) => {
                updateSaveState("ERROR");
                throw e;
            });
    }

    function undoState() {
        if (history.canUndo) {
            const updatedHistory = history.undo(getEditDocumentMetadata());
            initItems(updatedHistory.previous.items);
            setRemovedPages(updatedHistory.previous.removedPages);
            setPageRotations(updatedHistory.previous.pageRotations ?? {});
            setHistory(updatedHistory);
            isUndoRedoChange.current = true;
        }
    }
    function redoState() {
        if (history.canRedo) {
            const nextHistory = history.next;
            initItems(nextHistory.items);
            setRemovedPages(nextHistory.removedPages);
            setPageRotations(nextHistory.pageRotations ?? {});
            setHistory(history.redo(nextHistory));
            isUndoRedoChange.current = true;
        }
    }

    function getEditDocumentMetadata(): EditDocumentMetadata {
        return {
            removedPages: removedPages,
            items: items.filter((item) => item.state == "ITEM" || item.state == undefined),
            pageRotations,
        };
    }

    async function finishPdf(): Promise<ClosingWindow> {
        if (!onSubmit) return;
        allowWindowCloseRef.current = true;
        const { documentFile, config } = await getProcessedPdf();
        updateSavingDocumentState(0);
        return await onSubmit(config, documentFile)
            .then((closingWindow: ClosingWindow) => {
                if (!closingWindow) {
                    allowWindowCloseRef.current = false;
                }
                if (savingDocumentTimerRef.current) {
                    clearTimeout(savingDocumentTimerRef.current);
                    savingDocumentTimerRef.current = null;
                }
                updateSaveState(closingWindow ? "CLOSING_WINDOW" : "IDLE");
                return closingWindow;
            })
            .catch((e) => {
                allowWindowCloseRef.current = false;
                if (savingDocumentTimerRef.current) {
                    clearTimeout(savingDocumentTimerRef.current);
                    savingDocumentTimerRef.current = null;
                }
                updateSaveState("ERROR");
                throw e;
            });
    }

    function updateSavingDocumentState(currentValue: number) {
        updateSaveState("SAVING_DOCUMENT", currentValue);
        if (currentValue >= 95) {
            return;
        }
        if (savingDocumentTimerRef.current) {
            clearTimeout(savingDocumentTimerRef.current);
        }
        savingDocumentTimerRef.current = setTimeout(() => {
            updateSavingDocumentState(currentValue + 5);
        }, 200);
    }

    function onProducePdfProgressUpdated(process: IProducerProgress) {
        updateSaveState("PRODUCING", process.progress);
    }
    async function resolveDocumentBytes(): Promise<ArrayBuffer | Uint8Array> {
        if (typeof documentFile == "string") {
            return await fetch(documentFile).then((res) => res.arrayBuffer());
        }

        if (documentFile instanceof Blob) {
            return await documentFile.arrayBuffer();
        }

        return documentFile;
    }

    function getEditDocumentMetadataSnapshot(): EditDocumentMetadata {
        const editConfig = getEditDocumentMetadata();
        return {
            removedPages: [...editConfig.removedPages],
            items: [...editConfig.items],
            pageRotations: { ...(editConfig.pageRotations ?? {}) },
        };
    }

    async function buildProcessedPdf(
        config: EditDocumentMetadata,
        onProgressUpdate?: (process: IProducerProgress) => void,
    ): Promise<{ documentFile: Uint8Array; config: EditDocumentMetadata }> {
        const existingPdfBytes = await resolveDocumentBytes();

        return await new PdfProducer(existingPdfBytes)
            .init(config, dokumentMetadata?.title, onProgressUpdate, editorPageRefOrder.current)
            .then((p) => p.process())
            .then((p) => p.saveChanges())
            .then((p) => ({
                documentFile: p.getProcessedDocument(),
                config,
            }));
    }

    async function getProcessedPdf(): Promise<{ documentFile: Uint8Array; config: EditDocumentMetadata }> {
        if (inFlightProcessedPdf.current) {
            return inFlightProcessedPdf.current;
        }

        const config = getEditDocumentMetadataSnapshot();
        const processingPromise = buildProcessedPdf(config, onProducePdfProgressUpdated);

        inFlightProcessedPdf.current = processingPromise;
        try {
            return await processingPromise;
        } finally {
            inFlightProcessedPdf.current = null;
        }
    }

    async function previewPdf(): Promise<void> {
        updateSaveState("PRODUCING", 0);
        const { documentFile } = await getProcessedPdf();
        updateSaveState("IDLE");
        FileUtils.openFile(documentFile);
    }

    async function previewOriginalPdf(): Promise<void> {
        const originalBytes = await resolveDocumentBytes();
        FileUtils.openFile(originalBytes);
    }

    async function onSavePdf(closeAfterSave?: boolean): Promise<ClosingWindow> {
        return savePdf(getEditDocumentMetadata(), closeAfterSave, submitOnSave);
    }
    async function savePdf(
        saveEditDocumentData: EditDocumentMetadata,
        closeAfterSave?: boolean,
        submit?: boolean,
    ): Promise<ClosingWindow> {
        setIsSavingDocumentConfig(true);
        setLastSavedData(saveEditDocumentData);
        return new Promise<ClosingWindow>((resolve, reject) => {
            if (closeAfterSave) {
                if (submit) {
                    finishPdf().then(resolve).catch(reject);
                } else {
                    if (onSaveAndClose) {
                        onSaveAndClose(saveEditDocumentData).then(resolve).catch(reject);
                    } else {
                        resolve(false);
                    }
                }
            } else {
                if (onSave) {
                    onSave(saveEditDocumentData).then(resolve).catch(reject);
                } else {
                    resolve(false);
                }
            }
        }).finally(() => {
            setIsSavingDocumentConfig(false);
        });
    }

    function getInitialRemovedPages(): number[] {
        const config = dokumentMetadata ?? EditorConfigStorage.get(queryParams().id);
        return config?.editorMetadata?.removedPages ?? [];
    }

    function getInitialPageRotations(): Record<number, number> {
        const config = dokumentMetadata ?? EditorConfigStorage.get(queryParams().id);
        const rawPageRotations = config?.editorMetadata?.pageRotations ?? {};

        return Object.entries(rawPageRotations).reduce(
            (acc, [key, value]) => {
                const pageNumber = Number(key);
                const normalizedRotation = normalizeRotation(Number(value));

                if (!Number.isNaN(pageNumber) && normalizedRotation !== 0) {
                    acc[pageNumber] = normalizedRotation;
                }

                return acc;
            },
            {} as Record<number, number>,
        );
    }

    function rotatePage(pageNumber: number, direction: "LEFT" | "RIGHT") {
        rotateMaskingItemsForPage(pageNumber, direction);
        setPageRotations((prev) => {
            const currentRotation = normalizeRotation(prev[pageNumber] ?? 0);
            const nextRotation = normalizeRotation(currentRotation + (direction === "RIGHT" ? 90 : -90));
            LoggerService.info(
                `rotatePage: ${JSON.stringify({
                    pageNumber,
                    direction,
                    previousRotation: prev[pageNumber] ?? 0,
                    currentRotation,
                    nextRotation,
                    pageRotationsBefore: prev,
                })}`,
            );

            if (nextRotation === 0) {
                const next = { ...prev };
                delete next[pageNumber];
                LoggerService.info(
                    `rotatePage cleared: ${JSON.stringify({
                        pageNumber,
                        direction,
                        pageRotationsAfter: next,
                    })}`,
                );
                return next;
            }

            const nextState = {
                ...prev,
                [pageNumber]: nextRotation,
            };
            LoggerService.info(
                `rotatePage applied: ${JSON.stringify({
                    pageNumber,
                    direction,
                    pageRotationsAfter: nextState,
                })}`,
            );
            return nextState;
        });
    }

    function rotateMaskingItemsForPage(pageNumber: number, direction: "LEFT" | "RIGHT") {
        const pageElement = document.getElementById(`droppable_page_${pageNumber}`);
        if (!pageElement) {
            return;
        }

        const pageWidth = pageElement.clientWidth;
        const pageHeight = pageElement.clientHeight;
        if (pageWidth === 0 || pageHeight === 0) {
            return;
        }

        const rotatedItems = items.map((item) => {
            if (item.pageNumber !== pageNumber) {
                return item;
            }

            const currentX = item.coordinates.x;
            const currentYTop = pageHeight + item.coordinates.y;
            const currentWidth = item.coordinates.width;
            const currentHeight = item.coordinates.height;

            const rotatedX = direction === "RIGHT" ? pageHeight - (currentYTop + currentHeight) : currentYTop;
            const rotatedYTop = direction === "RIGHT" ? currentX : pageWidth - (currentX + currentWidth);
            const rotatedWidth = currentHeight;
            const rotatedHeight = currentWidth;
            const newPageHeight = pageWidth;

            return {
                ...item,
                coordinates: {
                    x: rotatedX,
                    y: rotatedYTop - newPageHeight,
                    width: rotatedWidth,
                    height: rotatedHeight,
                },
            };
        });

        initItems(rotatedItems);
    }

    function normalizeRotation(rotation: number) {
        const snappedRotation = Math.round(rotation / 90) * 90;
        const normalizedRotation = ((snappedRotation % 360) + 360) % 360;
        return normalizedRotation;
    }

    function onToggleSidebar() {
        setSidebarHidden((prev) => !prev);
    }

    function toggleDeletedPage(pageNumber: number) {
        setRemovedPages((prev) => {
            if (prev.includes(pageNumber)) {
                return prev.filter((p) => p !== pageNumber).sort();
            } else {
                return [...prev, pageNumber].sort();
            }
        });
    }

    function isAllowedToDeletePage() {
        return removedPages.length + 1 < totalPages.current;
    }

    function onInit(_totalPages: number, pageRefs: string[]) {
        totalPages.current = _totalPages;
        editorPageRefOrder.current = pageRefs ?? [];
    }

    return (
        <div tabIndex={-1} ref={divRef}>
            <PdfEditorContext.Provider
                value={{
                    mode,
                    produceAndSaveProgress,
                    hasUnsavedChanges,
                    totalPages: totalPages.current,
                    forsendelseId: journalpostId,
                    history,
                    onUndo: () => undoState(),
                    onRedo: () => redoState(),
                    onInit,
                    dokumentreferanse,
                    dokumentMetadata,
                    isSavingEditDocumentConfig,
                    sidebarHidden,
                    hideSidebar: () => setSidebarHidden(true),
                    removedPages,
                    maskedPagesCount,
                    maskedPageNumbers,
                    maskItemsCount,
                    maskItemsByPage,
                    pageRotations,
                    isAllowedToDeletePage,
                    previewPdf,
                    previewOriginalPdf,
                    onToggleSidebar,
                    toggleDeletedPage,
                    rotatePage,
                    savePdf: onSavePdf,
                    finishPdf,
                }}
            >
                {children}
            </PdfEditorContext.Provider>
        </div>
    );
}
