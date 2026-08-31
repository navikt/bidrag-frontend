import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

const PDF_RENDER_SCALE = 3;

export interface IPdfRenderedPage {
    dataUrl: string;
    height: number;
    width: number;
}

// Copied from https://github.com/ol-th/pdf-img-convert.js/blob/master/pdf-img-convert.js
export default async function pdf2Image(
    pdfData: Uint8Array,
    onPageProcessed: (pageNumber: number, page: IPdfRenderedPage) => Promise<void>,
): Promise<number> {
    const loadingTask = pdfjs.getDocument({ data: pdfData.slice(), disableFontFace: false, verbosity: 0 });

    const pdfDocument = await loadingTask.promise;

    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const currentPage = await doc_render(pdfDocument, i);
        if (currentPage != null) {
            await onPageProcessed(i, currentPage);
        }
    }

    return pdfDocument.numPages;
}

async function doc_render(pdfDocument: PDFDocumentProxy, pageNo) {
    // Page number sanity check
    if (pageNo < 1 || pageNo > pdfDocument.numPages) {
        console.error(`Invalid page number ${pageNo}`);
        return;
    }
    const page = await pdfDocument.getPage(pageNo);
    // Create a viewport at 100% scale
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const ctx = canvas.getContext("2d");
    const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
    };
    await page.render(renderContext).promise;
    return {
        dataUrl: canvas.toDataURL("image/png", 1),
        height: viewport.height / PDF_RENDER_SCALE,
        width: viewport.width / PDF_RENDER_SCALE,
    };
}
