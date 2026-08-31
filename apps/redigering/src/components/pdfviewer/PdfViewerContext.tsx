import React, { type MutableRefObject, type PropsWithChildren, useContext, useRef, useState } from "react";
import { useControls, useTransformContext, useTransformEffect, useTransformInit } from "react-zoom-pan-pinch";

import type { PdfDocumentRef } from "../pdfcore/PdfDocument";
import type { PdfDocumentType } from "../utils/types";

export interface PdfViewerContextProps {
    file: PdfDocumentType;
    dokumentRef: MutableRefObject<PdfDocumentRef>;
    pages: number[];
    currentPage: number;
    scale: number;
    pagesCount: number;
    pageRefs: string[];
    onPageChange: (pagenumber: number) => void;
    goToPage: (pagenumber: number) => void;
    onDocumentLoaded?: (pagesCount: number, pages: number[], pageRefs: string[]) => void;
    zoom: {
        onZoomIn: () => void;
        onZoomOut: () => void;
        resetZoom: () => void;
        zoomToFit: () => void;
    };
}

export const usePdfViewerContext = () => {
    const context = useContext(PdfViewerContext);
    if (context === undefined) {
        throw new Error("usePdfViewerContext must be used within a PdfViewerContextProvider");
    }
    return context;
};
export const PdfViewerContext = React.createContext<PdfViewerContextProps>({} as PdfViewerContextProps);

interface IPdfViewerContextProviderProps {
    pages?: number[];
    documentFile: PdfDocumentType;
    onPageChange?: (pageNumber: number) => void;
    onDocumentLoaded?: (pagesCount: number, pages: number[], pageRefs: string[]) => void;
}
export default function PdfViewerContextProvider({
    children,
    pages,
    documentFile,
    onDocumentLoaded: _onDocumentLoaded,
    onPageChange: _onPageChange,
}: PropsWithChildren<IPdfViewerContextProviderProps>) {
    const [_pages, setPages] = useState([]);
    const [pagesCount, setPagesCount] = useState(0);
    const [pageRefs, setPageRefs] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1);
    const dokumentRef = useRef<PdfDocumentRef>(undefined);
    const { getContext, setTransformState } = useTransformContext();
    const { zoomIn, zoomOut, zoomToElement } = useControls();
    useTransformInit((ref) => {
        setScale(ref.state.scale);
    });
    useTransformEffect((ref) => {
        setScale(ref.state.scale);
    });

    function onZoomIn() {
        zoomIn(undefined, undefined, "easeInOutCubic");
    }

    function onZoomOut() {
        zoomOut();
    }

    function resetZoom() {
        getContext().centerView(1);
    }

    function zoomToFit() {
        const element = document
            .getElementById("container_pdf_document_pages")
            .querySelector(`.page[data-page-number="${currentPage}"]`);
        zoomToElement(element as HTMLElement, 2.5, undefined, "easeInCubic");
    }
    function onDocumentLoaded(pagesCount: number, pages: number[], pageRefs: string[]) {
        setPages(pages);
        setPagesCount(pagesCount);
        setPageRefs(pageRefs);
        _onDocumentLoaded?.(pagesCount, pages, pageRefs);
    }
    function onPageChange(pagenumber: number) {
        setCurrentPage(pagenumber);
        _onPageChange?.(pagenumber);
    }

    function goToPage(pagenumber: number) {
        const { state } = getContext();
        if (state.positionX !== 0 || state.positionY !== 0) {
            setTransformState(state.scale, 0, 0);
        }
        onPageChange(pagenumber);
        dokumentRef.current?.scrollToPage(pagenumber);
    }

    return (
        <PdfViewerContext.Provider
            value={{
                pages: pages ?? _pages,
                file: documentFile,
                currentPage,
                pagesCount,
                pageRefs,
                onDocumentLoaded,
                onPageChange,
                goToPage,
                scale,
                dokumentRef,
                zoom: {
                    onZoomIn,
                    onZoomOut,
                    resetZoom,
                    zoomToFit,
                },
            }}
        >
            {children}
        </PdfViewerContext.Provider>
    );
}
