import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { EventBus, PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { createContext, useContext } from "react";

export interface PdfDocumentContextProps {
    pdfDocument: PDFDocumentProxy;
    renderPageIndexes: number[];
    onPageLoaded?: (pageNumber: number, page: PDFPageProxy) => void;
    scale: number;
    pdfEventBus?: MutableRefObject<EventBus>;
    pdfViewerRef?: MutableRefObject<PDFViewer>;
}

export const usePdfDocumentContext = () => useContext(PdfDocumentContext);
export const PdfDocumentContext = createContext<PdfDocumentContextProps>({} as PdfDocumentContextProps);
