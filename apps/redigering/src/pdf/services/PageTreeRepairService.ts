import { LoggerService } from "@bidrag/common";
import type { PDFDocument, PDFPage } from "@cantoo/pdf-lib";

import type { EditDocumentMetadata } from "../../types/EditorTypes";

/**
 * Stateless helpers for reconciling a pdf-lib page tree against the page order the editor
 * (pdfjs-dist) originally showed the user, and for translating page-number-based editor
 * config across page-tree repairs that change page order.
 *
 * These functions take all required state as parameters and return results without holding
 * any state themselves — callers (e.g. PdfProducer) own and persist the relevant state
 * (the document, the editor-visible ref order, the config) across calls.
 */

export function getCurrentPageRefOrder(pdfDocument: PDFDocument): string[] {
    return pdfDocument.getPages().map((page) => page.ref.toString());
}

/**
 * Reorders the page tree in place so it matches editorVisiblePageRefOrder, using the
 * low-level catalog.removeLeafNode/insertLeafNode primitives (no copyPages, so this works
 * even on PDFs with a broken parent chain). Pages not present in editorVisiblePageRefOrder
 * (e.g. newly recovered pages) are appended after the known sequence.
 *
 * Returns true if the page tree was reordered, false if it already matched or if reordering
 * was not possible (e.g. some pages could not be resolved).
 */
export function restoreEditorVisiblePageOrder(pdfDocument: PDFDocument, editorVisiblePageRefOrder: string[]): boolean {
    if (editorVisiblePageRefOrder.length === 0) {
        return false;
    }

    const currentPages = pdfDocument.getPages();
    const pageByRef = new Map(currentPages.map((page) => [page.ref.toString(), page]));
    const orderedPages = [
        ...editorVisiblePageRefOrder.map((ref) => pageByRef.get(ref)).filter((page): page is PDFPage => !!page),
        ...currentPages.filter((page) => !editorVisiblePageRefOrder.includes(page.ref.toString())),
    ];

    if (orderedPages.length !== currentPages.length) {
        LoggerService.warn(
            `restoreEditorVisiblePageOrder: Could not resolve all pages currentPageCount=${currentPages.length} orderedPageCount=${orderedPages.length}`,
        );
        return false;
    }

    const currentOrder = currentPages.map((page) => page.ref.toString());
    const desiredOrder = orderedPages.map((page) => page.ref.toString());
    if (currentOrder.every((ref, index) => ref === desiredOrder[index])) {
        return false;
    }

    for (let index = 0; index < currentPages.length; index++) {
        pdfDocument.catalog.removeLeafNode(0);
    }
    orderedPages.forEach((page, index) => pdfDocument.catalog.insertLeafNode(page.ref, index));

    LoggerService.info(`restoreEditorVisiblePageOrder: Reordered ${orderedPages.length} page(s) to editor order`);
    return true;
}

/**
 * Translates page-number-based editor config (removedPages, masking items) from the page
 * numbering that existed before a page-tree repair to the numbering after it, using the
 * before/after ref order to build the index mapping. Rotations are intentionally NOT
 * remapped: they stay bound to the visual page numbers the editor presents, since remapping
 * them by repaired ref order has caused wrong-page rotation on PDFs with broken original
 * page linking (e.g. missing first page recovered during repair).
 *
 * Returns a new EditDocumentMetadata; does not mutate the input.
 */
export function remapConfigAfterPageOrderChange(
    config: EditDocumentMetadata,
    pageRefsBeforeFix: string[],
    pageRefsAfterFix: string[],
): EditDocumentMetadata {
    if (pageRefsBeforeFix.length === 0 || pageRefsAfterFix.length === 0) {
        return config;
    }

    const pageNumberMap = new Map<number, number>();
    pageRefsBeforeFix.forEach((ref, oldIndex) => {
        const newIndex = pageRefsAfterFix.indexOf(ref);
        if (newIndex >= 0) {
            pageNumberMap.set(oldIndex + 1, newIndex + 1);
        }
    });

    if (pageNumberMap.size === 0) {
        return config;
    }

    return {
        ...config,
        removedPages: config.removedPages
            .map((page) => pageNumberMap.get(page) ?? page)
            .filter((page, index, arr) => arr.indexOf(page) === index)
            .sort((a, b) => a - b),
        items: config.items.map((item) => ({
            ...item,
            pageNumber: pageNumberMap.get(item.pageNumber) ?? item.pageNumber,
        })),
        pageRotations: config.pageRotations,
    };
}
