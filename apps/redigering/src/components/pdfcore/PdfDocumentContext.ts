import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { EventBus, PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import React, { useContext } from "react";

export interface PdfDocumentContextProps {
    pdfDocument: PDFDocumentProxy;
    renderPageIndexes: number[];
    onPageLoaded?: (pageNumber: number, page: PDFPageProxy) => void;
    scale: number;
    pdfEventBus?: React.MutableRefObject<EventBus>;
    pdfViewerRef?: React.MutableRefObject<PDFViewer>;
}

export const usePdfDocumentContext = () => useContext(PdfDocumentContext);
export const PdfDocumentContext = React.createContext<PdfDocumentContextProps>({} as PdfDocumentContextProps);
