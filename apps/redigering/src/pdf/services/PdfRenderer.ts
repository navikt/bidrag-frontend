import { LoggerService } from "@navikt/bidrag-ui-common";

import pdf2Image, { IPdfRenderedPage } from "../Pdf2Image";

/**
 * Stateless wrapper around pdf2Image that renders every page of a PDF (given as bytes) to a
 * PNG image and collects the results into a page-indexed map. Used by both the masked-page
 * rasterization path and the full-document corrupt-PDF rebuild path so both share one
 * pdfjs-dist rendering implementation and one image-fetch strategy.
 */

export interface IRenderedPdfPage {
    blob: Uint8Array;
    width: number;
    height: number;
}

export interface IRenderedPdfPages {
    /** Rendered pages keyed by 0-based page index. */
    images: Map<number, IRenderedPdfPage>;
    /** Total number of pages pdfjs-dist resolved for the given bytes. */
    pageCount: number;
}

export type PageRenderFilter = (pageIndex: number) => boolean;

async function fetchRenderedPageBlob(renderedPage: IPdfRenderedPage): Promise<Uint8Array> {
    const response = await fetch(renderedPage.dataUrl);
    if (!response.ok) {
        throw new Error(`Feilet henting av sidebilde: ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
}

/**
 * Renders pages from pdfBytes to images via pdfjs-dist.
 *
 * @param pdfBytes The PDF bytes to render.
 * @param shouldRenderPage Optional filter; when provided, only pages for which this returns
 *                         true are fetched/decoded (skipped pages are still counted in pageCount).
 * @param onPageRendered Optional callback invoked after each rendered page is added to the map.
 */
export async function renderPdfPagesToImages(
    pdfBytes: Uint8Array,
    shouldRenderPage?: PageRenderFilter,
    onPageRendered?: (pageIndex: number, imageMap: Map<number, IRenderedPdfPage>) => void
): Promise<IRenderedPdfPages> {
    const images = new Map<number, IRenderedPdfPage>();

    const pageCount = await pdf2Image(pdfBytes, async (pageNumber, renderedPage) => {
        const pageIndex = pageNumber - 1;
        if (shouldRenderPage && !shouldRenderPage(pageIndex)) {
            return;
        }

        const blob = await fetchRenderedPageBlob(renderedPage);
        images.set(pageIndex, { blob, width: renderedPage.width, height: renderedPage.height });
        onPageRendered?.(pageIndex, images);
    }).catch((error) => {
        LoggerService.error(
            `renderPdfPagesToImages: pdfjs rendering failed: ${error instanceof Error ? error.message : String(error)}`,
            error
        );
        throw error;
    });

    return { images, pageCount };
}
