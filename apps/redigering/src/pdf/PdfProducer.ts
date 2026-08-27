import { FileUtils, LoggerService } from "@bidrag/common";
import {
    type PDFDict,
    PDFDocument,
    type PDFFont,
    PDFName,
    type PDFPage,
    PDFPageLeaf,
    RotationTypes,
    StandardFonts,
} from "@cantoo/pdf-lib";

import type { IMaskingItemProps } from "../components/masking/MaskingItem";
import type { PdfDocumentType } from "../components/utils/types";
import type { EditDocumentMetadata } from "../types/EditorTypes";
import { PdfAConverter } from "./PdfAConverter";
import { getErrorMessage, isPageTreeCorruptionError } from "./PdfErrorUtils";
import {
    fixMissingPages,
    flattenForm,
    hasInvalidXObject,
    lastGyldigPDF,
    PdfProducerHelpers,
    repairBrokenParentChain,
    repairPDF,
} from "./PdfHelpers";
import { maskPages as maskPagesOnDocument } from "./services/MaskingService";
import {
    getCurrentPageRefOrder as getCurrentPageRefOrderOf,
    remapConfigAfterPageOrderChange as remapConfigAfterPageOrderChangeOf,
    restoreEditorVisiblePageOrder as restoreEditorVisiblePageOrderOf,
} from "./services/PageTreeRepairService";
import { type IRenderedPdfPage, renderPdfPagesToImages } from "./services/PdfRenderer";

type ProgressState = "MASK_PAGE" | "CONVERT_PAGE_TO_IMAGE" | "REMOVE_PAGE" | "SAVE_PDF";
export interface IProducerProgress {
    state: ProgressState;
    progress: number;
}

export class PdfProducer {
    private pdfDocument: PDFDocument;
    private title: string;
    private pdfBlob: PdfDocumentType;
    private processedDocument: Uint8Array;
    private config: EditDocumentMetadata;
    private onProgressUpdate: (process: IProducerProgress) => void;
    private hasRunFixingBeforeProcessing = false;
    private intentionallyRemovedPageRefs = new Set<string>();
    private basePageRotationsByPageNumber: Record<number, number> = {};
    private editorVisiblePageRefOrder: string[] = [];
    private copyPagesUnavailable = false; // Track if copyPages is broken on this PDF
    private requiresOriginalPdfRasterization = false;

    private font: PDFFont;
    constructor(pdfBlob: PdfDocumentType) {
        this.pdfBlob = pdfBlob;
    }

    async init(
        config: EditDocumentMetadata,
        title?: string,
        onProgressUpdate?: (process: IProducerProgress) => void,
        editorPageRefOrder?: string[],
    ): Promise<PdfProducer> {
        this.title = title ?? "Dokument";
        this.config = config;
        this.intentionallyRemovedPageRefs.clear();
        this.onProgressUpdate = onProgressUpdate;
        await this.loadPdf();
        // The frontend editor renders pages via pdfjs-dist, which tolerates broken/incomplete
        // page trees far better than pdf-lib's strict traversal. On corrupt PDFs, pdf-lib's own
        // recovery heuristic (fixMissingPages, which reinserts detached page leaves ordered by
        // PDF object number) is only a guess at the original page order, and that guess can
        // disagree with what pdfjs-dist actually resolved and showed the user. Prefer the real
        // ref order pdfjs-dist saw (passed down from the editor) as ground truth so recovery
        // reorders pages to match exactly what the user looked at and clicked on, instead of
        // re-deriving a potentially different order from scratch.
        if (editorPageRefOrder && editorPageRefOrder.length > 0) {
            this.editorVisiblePageRefOrder = editorPageRefOrder;
        }
        await this.runFixingScriptBeforeSave();
        if (!editorPageRefOrder || editorPageRefOrder.length === 0) {
            // No editor-provided ground truth available (e.g. flows outside the redigering
            // editor UI). Fall back to pdf-lib's own post-recovery order as before.
            this.editorVisiblePageRefOrder = this.getCurrentPageRefOrder();
        } else {
            const currentRefs = this.getCurrentPageRefOrder();
            const currentRefSet = new Set(currentRefs);
            const editorRefSet = new Set(editorPageRefOrder);
            const missingFromDocument = editorPageRefOrder.filter((ref) => !currentRefSet.has(ref));
            const missingFromEditor = currentRefs.filter((ref) => !editorRefSet.has(ref));
            if (missingFromDocument.length > 0 || missingFromEditor.length > 0) {
                // Real consistency issue worth flagging: the editor's ground-truth ref order and
                // pdf-lib's post-recovery page tree disagree on which pages exist.
                LoggerService.warn(
                    `PdfProducer init editorPageRefOrder mismatch missingFromDocumentCount=${missingFromDocument.length} missingFromEditorCount=${missingFromEditor.length}`,
                );
            }
        }
        return this;
    }

    private async loadPdf() {
        this.pdfDocument = await lastGyldigPDF(this.pdfBlob);
        // Repair broken parent chain before any other operation.
        // Some PDFs have PDFPageLeaf nodes whose Parent ref points to a non-PDFPageTree object.
        // This causes "Parent.ascend is not a function" in every inheritable-attribute lookup
        // (getRotation, getWidth, getHeight, Resources, MediaBox, …). Fix it here so all
        // subsequent operations work without needing per-call try/catch guards.
        repairBrokenParentChain(this.pdfDocument);
        this.font = await this.pdfDocument.embedFont(StandardFonts.TimesRoman);
    }
    private onProgressUpdated(state: ProgressState, pageNumber: number, progress?: number) {
        this.onProgressUpdate?.({
            state,
            progress: this.getProgressByWeight(state, pageNumber, progress),
        });
    }

    private getProgressByWeight(state: ProgressState, pageNumber: number, _progress?: number) {
        try {
            const totalPages = this.pdfDocument.getPageCount();
            const progress = _progress ?? pageNumber / totalPages;
            const percentageRange = this.stateToProgressPercentageRate(state);

            const result = Math.round((percentageRange[1] - percentageRange[0]) * progress + percentageRange[0]);
            return result;
        } catch (e) {
            console.error("Error in getProgressByWeight", e);
            return 1;
        }
    }

    private stateToProgressPercentageRate(state: ProgressState): number[] {
        switch (state) {
            case "MASK_PAGE":
                return [0, 20];
            case "CONVERT_PAGE_TO_IMAGE":
                return [20, 80];
            case "REMOVE_PAGE":
                return [80, 90];
            case "SAVE_PDF":
                return [90, 100];
        }
    }

    // Processing happens in three phases:
    // 1. Repair and stabilize the page tree before any page-number-based edits.
    // 2. Apply user edits (flatten, rotate, mask, replace masked pages, remove pages).
    // 3. Run a narrow post-edit repair only when edits likely detached non-removed pages.
    async process(): Promise<PdfProducer> {
        // Repair missing pages before any editor config is applied so page numbers are
        // aligned with the repaired page tree rather than the raw corrupt structure.
        await this.fixReorderAndRemap();
        // Re-run synchronous page tree corruption check after repair/reorder, since
        // fixMissingPages can attach previously detached pages that also have broken parent chains.
        this.syncDetectPageTreeCorruption();
        this.captureBasePageRotations();
        this.hasRunFixingBeforeProcessing = true;

        //Remove known submit/reset form button before flattening to avoid invalid field references.
        this.removeSubmitButton();
        // Flatten form fields so all visual content is embedded directly in page content.
        // If flattening detects corruption it reloads the original raw PDF via onFlattenError,
        // which would otherwise silently discard the repair/reorder work above and desync
        // this.config.removedPages from the document. Redo fix+reorder+remap in that case so
        // removedPages keeps pointing at the correct pages.
        await flattenForm(this.pdfDocument, this.onFlattenError.bind(this), this.config.items.length > 0);
        // Repair low-level PDF structure issues that may appear after form flattening.
        await repairPDF(this.pdfDocument);
        // Some corrupt PDFs lose page-tree links again during flatten/repair operations.
        // Run a narrow recovery only when requested remove pages are out of range for the
        // current document, to avoid unnecessary second reorder/remap passes that can
        // duplicate pages in already-recovered documents.
        const maxRequestedRemovedPage = this.config.removedPages.length > 0 ? Math.max(...this.config.removedPages) : 0;
        if (maxRequestedRemovedPage > this.pdfDocument.getPageCount()) {
            // First normalize to force a fresh parse of the current page tree. Some corrupt PDFs
            // expose stale in-memory traversal state until a save/load roundtrip.
            await this.normalizePdfAfterFix();
            if (maxRequestedRemovedPage > this.pdfDocument.getPageCount()) {
                // Recover only up to the highest page number the user references. This avoids
                // rebuilding phantom pages beyond the effective editing range.
                await fixMissingPages(this.pdfDocument, this.intentionallyRemovedPageRefs, maxRequestedRemovedPage);
                await repairPDF(this.pdfDocument);
                // Refresh after low-level page-tree edits so normalization/removal reads the
                // updated structure instead of stale in-memory traversal state.
                await this.normalizePdfAfterFix();
            }
        }
        // Apply user-selected page rotations before masking so coordinates map to final orientation.
        this.applyPageRotations(this.config.pageRotations);
        // Normalize removal list once and filter masking items to valid, non-removed pages.
        const normalizedRemovePages = this.getNormalizedRemovePages(this.config.removedPages);
        const itemsFiltered = this.getValidMaskingItems(this.config.items, normalizedRemovePages);
        this.requiresOriginalPdfRasterization ||= hasInvalidXObject(this.pdfDocument);
        if (this.requiresOriginalPdfRasterization && itemsFiltered.length > 0) {
            if (await this.rebuildOriginalPdfAndMask(itemsFiltered)) {
                await this.removePages(normalizedRemovePages);
                await this.runPostEditFixingScript();
                this.editorVisiblePageRefOrder = this.getCurrentPageRefOrder();
                return this;
            }
        }
        // Draw masking rectangles/text on selected areas.
        this.maskPages(itemsFiltered);
        // Rasterize masked pages and replace them with images to make masking non-editable.
        await this.convertMaskedPagesToImage(itemsFiltered);
        // Remove pages marked for deletion after masking/conversion is complete.
        await this.removePages(normalizedRemovePages);
        // Re-run structural repair after edits to recover any non-removed pages
        // that become detached in corrupt PDFs during page operations.
        await this.runPostEditFixingScript();
        // Some PDFs recover pages only in the post-edit repair pass. Reapply the configured
        // rotations so those recovered pages match the editor state too. Skip pages that were
        // already rasterized during masking, because their visible rotation is already baked
        // into the image replacement and applying /Rotate again flips them a second time.
        const maskedPageNumbers = new Set(itemsFiltered.map((item) => item.pageNumber));
        this.applyPageRotations(this.config.pageRotations, maskedPageNumbers);

        // Masking (convertMaskedPagesToImage), page removal, and the post-edit repair pass all
        // rebuild this.pdfDocument via copyPages()/PDFDocument.create(), which mints brand new
        // object numbers unrelated to the pre-edit document. editorVisiblePageRefOrder still holds
        // the ORIGINAL pre-edit ref strings at this point. saveChanges() later calls
        // normalizePdfAfterFix(), which uses editorVisiblePageRefOrder to "preserve" page order via
        // reorderPagesToPreserveOriginalOrder() — matching by ref STRING equality. Because the
        // rebuilt document's object numbers are freshly (re)assigned starting from low integers,
        // they can coincidentally collide with old ref strings that meant something completely
        // different in the pre-edit document (e.g. old ref "298 0 R" was originally some unrelated
        // page, but the rebuilt document also happens to contain an unrelated object numbered
        // "298 0 R"). That accidental string match gets treated as "this original page still
        // exists here" and yanked to the front of the order, silently shifting every subsequent
        // page's content by however many refs coincidentally collided. Refresh
        // editorVisiblePageRefOrder to the now-correct, fully-edited order here so any later
        // reorder-preserving calls compare against the real current document instead of a stale,
        // pre-edit ref list.
        this.editorVisiblePageRefOrder = this.getCurrentPageRefOrder();

        return this;
    }

    // Reloads the raw original PDF and reruns fix+reorder+remap so this.config stays valid
    // against the document. Used both for the initial pass and after flattenForm has to roll
    // back to the raw bytes because flattening produced an invalid document.
    private async fixReorderAndRemap(): Promise<void> {
        const pageRefsBeforeFix =
            this.editorVisiblePageRefOrder.length > 0 ? this.editorVisiblePageRefOrder : this.getCurrentPageRefOrder();
        // fixMissingPages can change tree ordering on corrupt PDFs; restore the order that
        // the editor started from and then remap the stored page-based config to that order.
        // runFixingScriptBeforeSave() always normalizes (save/load roundtrip) after recovery:
        // pdf-lib caches the flattened page array from the first getPages() traversal and does
        // not invalidate it after catalog.insertLeafNode() mutates the tree, so recovered pages
        // stay invisible to getPages()/getPageCount() until that roundtrip forces a fresh parse.
        // Skipping it here previously discarded recovered pages permanently: convertMaskedPagesToImage()
        // later rebuilds the document via copyPages() from whatever getPages() currently reports,
        // so any page not yet visible at that point is lost for good.
        await this.runFixingScriptBeforeSave();
        // Returns the pre-reorder ref of the page now occupying each position. Reordering can
        // rebuild this.pdfDocument into a brand new PDFDocument whose refs are unrelated to the
        // old ones, so this must be captured from inside the reorder step rather than by reading
        // getCurrentPageRefOrder() again afterwards and comparing across the two documents.
        const oldRefOrderAfterFix = await this.reorderPagesToPreserveOriginalOrder(pageRefsBeforeFix);
        this.remapConfigAfterPageOrderChange(pageRefsBeforeFix, oldRefOrderAfterFix);
    }

    private async onFlattenError(): Promise<void> {
        // flattenForm may roll back to raw bytes when form flattening detects corruption.
        // Re-run fix+reorder+remap immediately so page-number-based config stays aligned.
        await this.loadPdf();
        await this.fixReorderAndRemap();
        this.removeSubmitButton();
    }

    // Thin delegations to PageTreeRepairService (stateless): PdfProducer owns the mutable
    // document/config/order state across calls, the service implements the pure logic.
    private getCurrentPageRefOrder(): string[] {
        return getCurrentPageRefOrderOf(this.pdfDocument);
    }

    private restoreEditorVisiblePageOrder(): void {
        restoreEditorVisiblePageOrderOf(this.pdfDocument, this.editorVisiblePageRefOrder);
    }

    private remapConfigAfterPageOrderChange(pageRefsBeforeFix: string[], pageRefsAfterFix: string[]): void {
        this.config = remapConfigAfterPageOrderChangeOf(this.config, pageRefsBeforeFix, pageRefsAfterFix);
    }

    private captureBasePageRotations(): void {
        this.basePageRotationsByPageNumber = {};
        this.pdfDocument.getPages().forEach((page, index) => {
            try {
                this.basePageRotationsByPageNumber[index + 1] = page.getRotation().angle;
            } catch {
                this.basePageRotationsByPageNumber[index + 1] = 0;
            }
        });
    }

    private async reorderPagesToPreserveOriginalOrder(pageRefsBeforeFix: string[]): Promise<string[]> {
        const pagesAfterFix = this.pdfDocument.getPages();
        if (pagesAfterFix.length === 0) {
            return pageRefsBeforeFix;
        }

        const refToCurrentIndex = new Map<string, number>();
        pagesAfterFix.forEach((page, index) => {
            refToCurrentIndex.set(page.ref.toString(), index);
        });

        const orderedRefsWithPotentialDuplicates = [
            // Keep every page that existed before repair in the exact sequence the editor saw.
            ...pageRefsBeforeFix.filter((ref) => refToCurrentIndex.has(ref)),
            // Any newly recovered pages are appended after the known sequence.
            ...pagesAfterFix.map((page) => page.ref.toString()).filter((ref) => !pageRefsBeforeFix.includes(ref)),
        ];

        const seenRefs = new Set<string>();
        const orderedRefs = orderedRefsWithPotentialDuplicates.filter((ref) => {
            if (seenRefs.has(ref)) {
                return false;
            }
            seenRefs.add(ref);
            return true;
        });

        const orderedIndexes = orderedRefs
            .map((ref) => refToCurrentIndex.get(ref))
            .filter((index): index is number => typeof index === "number");

        const alreadyOrdered = orderedIndexes.every((index, idx) => index === idx);
        if (alreadyOrdered) {
            // this.pdfDocument was not replaced, so its refs are still exactly orderedRefs.
            return orderedRefs;
        }

        // Skip if copyPages is already known to be broken on this PDF
        if (this.copyPagesUnavailable) {
            LoggerService.warn(
                `reorderPagesToPreserveOriginalOrder: copyPages already detected as unavailable. Skipping reordering.`,
            );
            return this.getCurrentPageRefOrder();
        }

        const reorderedPdf = await PDFDocument.create();
        try {
            const copiedPages = await this.safeCopyPages(reorderedPdf, this.pdfDocument, orderedIndexes);
            copiedPages.forEach((page) => reorderedPdf.addPage(page));
            this.copyDocumentMetadata(this.pdfDocument, reorderedPdf);
            this.pdfDocument = reorderedPdf;
            this.font = await this.pdfDocument.embedFont(StandardFonts.TimesRoman);
        } catch (error) {
            LoggerService.warn(
                `reorderPagesToPreserveOriginalOrder: Rebuild failed: ${getErrorMessage(error)}. Keeping current page order.`,
            );
            // If reordering fails, keep the current document order
            return this.getCurrentPageRefOrder();
        }

        // this.pdfDocument is now a brand new document with unrelated ref numbers, so the only
        // way to describe "what old page ends up at which new position" is this array built
        // above, from the still-valid old refs, in their final order.
        return orderedRefs;
    }

    private async safeCopyPages(
        targetDoc: PDFDocument,
        origDoc: PDFDocument,
        pageIndices: number[],
    ): Promise<PDFPage[]> {
        try {
            return await targetDoc.copyPages(origDoc, pageIndices);
        } catch (error) {
            if (isPageTreeCorruptionError(error)) {
                this.copyPagesUnavailable = true;
                LoggerService.warn(`safeCopyPages: PDF page tree corrupted. copyPages cannot be used.`, error);
            }
            throw error;
        }
    }

    private copyDocumentMetadata(origDoc: PDFDocument, targetDoc: PDFDocument): void {
        if (PdfProducerHelpers.getAuthor(origDoc) !== undefined) {
            targetDoc.setAuthor(PdfProducerHelpers.getAuthor(origDoc)!);
        }
        if (PdfProducerHelpers.getCreationDate(origDoc) !== undefined) {
            targetDoc.setCreationDate(PdfProducerHelpers.getCreationDate(origDoc)!);
        }
        if (PdfProducerHelpers.getCreator(origDoc) !== undefined) {
            targetDoc.setCreator(PdfProducerHelpers.getCreator(origDoc)!);
        }
        if (PdfProducerHelpers.getModificationDate(origDoc) !== undefined) {
            targetDoc.setModificationDate(PdfProducerHelpers.getModificationDate(origDoc)!);
        }
        if (PdfProducerHelpers.getProducer(origDoc) !== undefined) {
            targetDoc.setProducer(PdfProducerHelpers.getProducer(origDoc)!);
        }
        if (PdfProducerHelpers.getSubject(origDoc) !== undefined) {
            targetDoc.setSubject(PdfProducerHelpers.getSubject(origDoc)!);
        }
        if (PdfProducerHelpers.getTitle(origDoc) !== undefined) {
            targetDoc.setTitle(PdfProducerHelpers.getTitle(origDoc)!);
        }
        targetDoc.defaultWordBreaks = origDoc.defaultWordBreaks;
    }

    async convertMaskedPagesToImage(items: IMaskingItemProps[]) {
        if (items.length === 0) {
            return;
        }

        const pageCount = this.pdfDocument.getPageCount();
        const maskedPages = Array.from(
            new Set(items.map((p) => p.pageNumber - 1).filter((pageIndex) => pageIndex >= 0 && pageIndex < pageCount)),
        ).sort((a, b) => a - b);
        if (maskedPages.length === 0) {
            return;
        }

        if (this.requiresOriginalPdfRasterization || this.copyPagesUnavailable) {
            await this.rebuildCorruptPdfViaPdfjs();
            return;
        }

        try {
            await this.convertMaskedPagesByCopy(maskedPages);
        } catch (error) {
            if (!isPageTreeCorruptionError(error)) {
                throw error;
            }

            this.copyPagesUnavailable = true;
            LoggerService.warn(
                "convertMaskedPagesToImage: copyPages failed on corrupt PDF. Rebuilding with pdfjs.",
                error,
            );
            await this.rebuildCorruptPdfViaPdfjs();
        }
    }

    private async convertMaskedPagesByCopy(maskedPages: number[]): Promise<void> {
        const tempDoc = await PDFDocument.create();

        for (const pageIndex of maskedPages) {
            const [copiedPage] = await this.safeCopyPages(tempDoc, this.pdfDocument, [pageIndex]);
            tempDoc.addPage(copiedPage);
        }

        const pdfBytes = await tempDoc.save();
        let imageMap: Map<number, IRenderedPdfPage>;
        try {
            const rendered = await renderPdfPagesToImages(pdfBytes, undefined, (renderedIndex, images) =>
                this.onProgressUpdated("CONVERT_PAGE_TO_IMAGE", renderedIndex + 1, images.size / maskedPages.length),
            );
            // pdf2Image reports 1-based page numbers relative to tempDoc (only the masked
            // pages), so remap those indices back to the original document's page indices.
            imageMap = new Map(
                Array.from(rendered.images.entries()).map(([tempIndex, image]) => {
                    const pageIndex = maskedPages[tempIndex];
                    if (pageIndex === undefined) {
                        throw new Error("Fant ikke forventet sideindeks under maskert bildegenerering");
                    }
                    return [pageIndex, image];
                }),
            );
        } catch (error) {
            LoggerService.warn(`convertMaskedPagesToImage: pdfjs rendering failed: ${getErrorMessage(error)}.`, error);
            throw error;
        }

        if (imageMap.size !== maskedPages.length) {
            throw new Error("Ikke alle maskerte sider ble konvertert til bilder");
        }

        const origDoc = this.pdfDocument;
        const newDoc = await PDFDocument.create();
        const allPageIndices = origDoc.getPageIndices();

        for (const pageIndex of allPageIndices) {
            const imageData = imageMap.get(pageIndex);
            if (imageData) {
                const { blob, width, height } = imageData;
                const newPage = newDoc.addPage([width, height]);
                const pngImage = await newDoc.embedPng(blob);
                newPage.drawImage(pngImage, pngImage.scaleToFit(width, height));
            } else {
                const [copiedPage] = await this.safeCopyPages(newDoc, origDoc, [pageIndex]);
                newDoc.addPage(copiedPage);
            }
        }

        // Preserve metadata and re-establish font reference
        this.copyDocumentMetadata(origDoc, newDoc);
        this.pdfDocument = newDoc;
        this.font = await this.pdfDocument.embedFont(StandardFonts.TimesRoman);

        LoggerService.info(
            `convertMaskedPagesToImage: Konverterte ${imageMap.size} maskerte sider til bilder, pageCount=${this.pdfDocument.getPageCount()}`,
        );
    }

    private async rebuildCorruptPdfViaPdfjs(): Promise<void> {
        const rebuilt = await this.rebuildDocumentViaPdfjs(await this.pdfDocument.save());
        if (!rebuilt) {
            throw new Error("Kunne ikke rekonstruere korrupt PDF med pdfjs");
        }
    }

    private getOriginalPdfBytes(): Uint8Array {
        if (typeof this.pdfBlob === "string") {
            return new TextEncoder().encode(this.pdfBlob);
        }
        return this.pdfBlob instanceof Uint8Array ? this.pdfBlob.slice() : new Uint8Array(this.pdfBlob);
    }

    private async rebuildOriginalPdfAndMask(items: IMaskingItemProps[]): Promise<boolean> {
        if (!(await this.rebuildDocumentViaPdfjs(this.getOriginalPdfBytes()))) {
            LoggerService.warn(
                "rebuildOriginalPdfAndMask: Could not rebuild the original PDF. Using legacy masking path.",
            );
            return false;
        }

        this.applyPageRotations(this.config.pageRotations);
        this.maskPages(items);

        if (!(await this.rebuildDocumentViaPdfjs(await this.pdfDocument.save()))) {
            LoggerService.warn("rebuildOriginalPdfAndMask: Could not rasterize masked PDF. Using legacy masking path.");
            return false;
        }

        return true;
    }

    private async rebuildDocumentViaPdfjs(pdfBytes: Uint8Array): Promise<boolean> {
        let imageMap: Map<number, IRenderedPdfPage>;
        let renderedPageCount: number;

        try {
            const rendered = await renderPdfPagesToImages(pdfBytes);
            imageMap = rendered.images;
            renderedPageCount = rendered.pageCount;
        } catch (error) {
            LoggerService.error(`rebuildDocumentViaPdfjs: pdfjs rendering failed: ${getErrorMessage(error)}`, error);
            return false;
        }

        if (imageMap.size !== renderedPageCount) {
            LoggerService.warn(
                `rebuildDocumentViaPdfjs: Rendered ${imageMap.size}/${renderedPageCount} pages. Document not rebuilt.`,
            );
            return false;
        }

        const origDoc = this.pdfDocument;
        const newDoc = await PDFDocument.create();

        try {
            for (let i = 0; i < imageMap.size; i++) {
                const imageData = imageMap.get(i);
                if (imageData) {
                    const { blob, width, height } = imageData;
                    const newPage = newDoc.addPage([width, height]);
                    const pngImage = await newDoc.embedPng(blob);
                    newPage.drawImage(pngImage, pngImage.scaleToFit(width, height));
                }
            }

            this.copyDocumentMetadata(origDoc, newDoc);
            this.pdfDocument = newDoc;
            this.font = await this.pdfDocument.embedFont(StandardFonts.TimesRoman);

            LoggerService.info(`rebuildDocumentViaPdfjs: Rebuilt PDF document via pdfjs (${imageMap.size} pages)`);
            return true;
        } catch (error) {
            LoggerService.error(
                `rebuildDocumentViaPdfjs: Failed to rebuild document from images: ${getErrorMessage(error)}`,
                error,
            );
            return false;
        }
    }

    private getNormalizedRemovePages(removePages: number[]): number[] {
        const totalPages = this.pdfDocument.getPageCount();
        return Array.from(new Set(removePages)).filter((page) => page >= 1 && page <= totalPages);
    }

    private getValidMaskingItems(items: IMaskingItemProps[], removePages: number[]): IMaskingItemProps[] {
        const removedPageSet = new Set(removePages);
        const totalPages = this.pdfDocument.getPageCount();
        return items.filter(
            (item) => item.pageNumber >= 1 && item.pageNumber <= totalPages && !removedPageSet.has(item.pageNumber),
        );
    }

    maskPages(items: IMaskingItemProps[]) {
        maskPagesOnDocument((pageNumber) => this.pdfDocument.getPage(pageNumber - 1), this.font, items);
    }

    private applyPageRotations(pageRotations?: Record<number, number>, excludedPageNumbers: Set<number> = new Set()) {
        if (!pageRotations) {
            return;
        }

        for (const [pageNumberString, rotationValue] of Object.entries(pageRotations)) {
            const pageNumber = Number(pageNumberString);
            if (
                Number.isNaN(pageNumber) ||
                pageNumber < 1 ||
                pageNumber > this.pdfDocument.getPageCount() ||
                excludedPageNumbers.has(pageNumber)
            ) {
                continue;
            }

            const page = this.pdfDocument.getPage(pageNumber - 1);
            let fallbackRotation = 0;
            try {
                fallbackRotation = page.getRotation().angle;
            } catch {
                /* corrupted parent chain */
            }
            const baseRotation = this.basePageRotationsByPageNumber[pageNumber] ?? fallbackRotation;
            const normalizedRotationDelta = (((Math.round(Number(rotationValue) / 90) * 90) % 360) + 360) % 360;
            const normalizedRotation = (((baseRotation + normalizedRotationDelta) % 360) + 360) % 360;
            page.setRotation({
                type: RotationTypes.Degrees,
                angle: normalizedRotation,
            });
        }
    }

    private removeSubmitButton() {
        try {
            const form = this.pdfDocument.getForm();
            for (const field of form.getFields()) {
                if (field.getName() == "nullstill") {
                    try {
                        form.removeField(field);
                    } catch (e) {
                        LoggerService.error("Det skjedde en feil ved fjerning av en nullstill knapp", e);
                    }
                }
            }
        } catch (e) {
            LoggerService.error("Det skjedde en feil ved fjerning av nullstill knapper fra PDF", e);
        }
    }

    async removePages(removePages: number[]): Promise<void> {
        const normalizedRemovePages = this.getNormalizedRemovePages(removePages);
        if (normalizedRemovePages.length === 0) {
            return;
        }

        normalizedRemovePages.forEach((pageNumber) => {
            const page = this.pdfDocument.getPage(pageNumber - 1);
            if (page?.ref) {
                // Missing-page repair should never resurrect user-deleted pages.
                this.intentionallyRemovedPageRefs.add(page.ref.toString());
            }
        });

        const hasInconsistentPageTree = this.hasInconsistentPageTree();
        LoggerService.info(
            `removePages: removing pages=${normalizedRemovePages.join("|")} hasInconsistentPageTree=${hasInconsistentPageTree}`,
        );
        try {
            // Copy-based removal is safer for healthy PDFs, but can permanently drop
            // detached/orphan pages from corrupt PDFs because they are not copied over.
            if (hasInconsistentPageTree) {
                this.removePagesInPlace(normalizedRemovePages);
            } else {
                await this.removePagesByCopy(normalizedRemovePages);
            }
        } catch (e) {
            LoggerService.error("Det skjedde en feil ved fjerning av sider", e);
            try {
                if (hasInconsistentPageTree) {
                    await this.removePagesByCopy(normalizedRemovePages);
                } else {
                    this.removePagesInPlace(normalizedRemovePages);
                }
            } catch (fallbackError) {
                LoggerService.error("Fallback for fjerning av sider feilet", fallbackError);
                throw fallbackError;
            }
        }
    }

    private hasInconsistentPageTree(): boolean {
        try {
            // A mismatch here is the strongest cheap signal that the PDF has detached page
            // leaves and should be handled conservatively during removal.
            const pageLeafCount = this.pdfDocument.context
                .enumerateIndirectObjects()
                .filter(([_, obj]) => obj instanceof PDFPageLeaf).length;
            return pageLeafCount !== this.pdfDocument.getPageCount();
        } catch {
            return true;
        }
    }

    private removePagesInPlace(removePages: number[]): void {
        const sortedPages = [...removePages].sort((a, b) => b - a);
        const numberOfPagesToRemove = sortedPages.length;
        let numberOfRemovedPages = 0;

        for (const page of sortedPages) {
            this.pdfDocument.removePage(page - 1);
            numberOfRemovedPages += 1;
            this.onProgressUpdated("REMOVE_PAGE", 0, numberOfRemovedPages / numberOfPagesToRemove);
        }
    }

    private async removePagesByCopy(removePages: number[]): Promise<void> {
        const origDoc = this.pdfDocument;
        const pdfCopy = await PDFDocument.create();
        const includePages = origDoc.getPageIndices().filter((pn) => !removePages.includes(pn + 1));

        // If copyPages is already known to be unavailable, skip directly to fallback
        if (this.copyPagesUnavailable) {
            LoggerService.warn(`removePagesByCopy: copyPages already unavailable. Using direct page removal instead.`);
            this.removePagesInPlace(removePages);
            return;
        }

        // Test if copyPages will work before attempting the full operation
        if (includePages.length > 0) {
            try {
                const testDoc = await PDFDocument.create();
                await testDoc.copyPages(origDoc, [includePages[0]]);
            } catch (testError) {
                const errorMsg = testError instanceof Error ? testError.message : String(testError);
                LoggerService.warn(
                    `removePagesByCopy: copyPages not available (${errorMsg}). Falling back to removePagesInPlace.`,
                );
                this.copyPagesUnavailable = true;
                // copyPages won't work, use direct removal API
                this.removePagesInPlace(removePages);
                return;
            }
        }

        try {
            const contentPages = await this.safeCopyPages(pdfCopy, origDoc, includePages);
            if (contentPages.length !== includePages.length) {
                LoggerService.warn(
                    `Expected to copy ${includePages.length} pages, but copied ${contentPages.length}. Continuing with available pages.`,
                );
            }

            let numberOfRemovedPages = 0;
            const numberOfPagesToRemove = contentPages.length;
            for (let idx = 0, len = contentPages.length; idx < len; idx++) {
                pdfCopy.addPage(contentPages[idx]);
                numberOfRemovedPages += 1;
                this.onProgressUpdated("REMOVE_PAGE", 0, numberOfRemovedPages / numberOfPagesToRemove);
            }

            this.copyDocumentMetadata(origDoc, pdfCopy);

            this.pdfDocument = pdfCopy;
        } catch (error) {
            LoggerService.warn(
                `removePagesByCopy failed: ${getErrorMessage(error)}. Falling back to removePagesInPlace.`,
                error,
            );
            this.copyPagesUnavailable = true;
            // If copying fails, fall back to direct removal
            this.removePagesInPlace(removePages);
        }
    }

    async saveChanges(): Promise<PdfProducer> {
        try {
            if (!this.hasRunFixingBeforeProcessing) {
                await this.runFixingScriptBeforeSave();
            } else {
                // process() already repaired the page tree, but pages recovered via
                // fixMissingPages() during process() stay invisible to getPages()/getPageCount()
                // until a save/load roundtrip forces pdf-lib to reparse the page tree. Without
                // this, those recovered pages are silently dropped from the final output.
                // normalizePdfAfterFix() preserves the already-established page order and
                // appends any newly revealed pages after it, instead of discarding them.
                await this.normalizePdfAfterFix();
            }

            this.processedDocument = await new PdfAConverter().convertAndSave(this.pdfDocument, this.title, false);
        } catch (e) {
            LoggerService.error("Det skjedde en feil ved lagring av PDF", e);
            throw e;
        }
        this.onProgressUpdated("SAVE_PDF", 0, 1);
        return this;
    }

    private syncDetectPageTreeCorruption(): void {
        if (this.copyPagesUnavailable) return;
        // getRotation() triggers the same internal getInheritableAttribute() → ascend() path
        // as copyPages, but is synchronous — so zone.js never sees a promise rejection.
        // Call this before any copyPages attempt to detect corruption early.
        const pages = this.pdfDocument.getPages();
        let corruptionDetected = false;
        for (let i = 0; i < pages.length; i++) {
            try {
                pages[i].getRotation();
            } catch (error) {
                if (isPageTreeCorruptionError(error)) {
                    if (!corruptionDetected) {
                        this.copyPagesUnavailable = true;
                        corruptionDetected = true;
                        LoggerService.warn(
                            `syncDetectPageTreeCorruption: PDF page tree corrupted on page ${i + 1} (Parent chain broken). copyPages will be skipped for this document.`,
                        );
                    }
                    // Repair this page by setting Resources directly, so drawText/drawRectangle
                    // don't need to traverse the parent chain when registering fonts
                    this.ensurePageResources(pages[i]);
                }
            }
        }
    }

    private ensurePageResources(page: PDFPage): void {
        const node = page.node;
        if (!node.get(PDFName.of("Resources"))) {
            // Set an empty Resources dict directly on this page.
            // Once Resources is present on the page itself, getInheritableAttribute('Resources')
            // returns it immediately without ascending to the broken Parent.
            const resourcesDict = node.context.obj({}) as PDFDict;
            node.set(PDFName.of("Resources"), resourcesDict);
        }
    }

    async runFixingScriptBeforeSave(): Promise<void> {
        this.syncDetectPageTreeCorruption();
        try {
            // ignored refs protect explicitly removed/replaced pages from being recreated by
            // the missing-page repair step.
            // No max-page cap here: this is the last repair pass before edit operations
            // (masking, page removal) may rebuild the document via copyPages, which only
            // clones the object graph reachable from the pages actually copied. Any leaf not
            // reattached to the page tree by this point is permanently unrecoverable, so
            // recovery must be exhaustive regardless of which page numbers the editor config
            // references.
            await fixMissingPages(this.pdfDocument, this.intentionallyRemovedPageRefs);
            this.restoreEditorVisiblePageOrder();
            await repairPDF(this.pdfDocument);
            // normalizePdfAfterFix must always run here: pdf-lib caches the flattened page array
            // from the first getPages() traversal and does not invalidate it after
            // catalog.insertLeafNode() mutates the tree, so recovered pages stay invisible to
            // getPages()/getPageCount() until a save/load roundtrip forces a fresh parse.
            await this.normalizePdfAfterFix();
        } catch (e) {
            LoggerService.error("Det skjedde en feil i fixing script før lagring av PDF", e);
        }
    }

    private async runPostEditFixingScript(): Promise<void> {
        try {
            // Use the current (post-mask/post-removal) order as the reference to preserve, not
            // editorVisiblePageRefOrder. Masking rebuilds the document via copyPages/PDFDocument.create(),
            // minting brand new refs for masked pages, and removal deletes refs outright. Both are
            // intentional. Reconciling against the pre-edit baseline here would treat every masked
            // page's new ref as "unknown"/newly recovered and push it to the end of the document,
            // silently undoing the mask/removal positioning the editor already applied.
            const pageRefsBeforeFix = this.getCurrentPageRefOrder();
            // Post-edit repair must still run after mask-only edits because the rebuild path can
            // expose previously detached pages. Missing pages are recovered unless they were
            // explicitly removed or replaced by the editor.
            await fixMissingPages(this.pdfDocument, this.intentionallyRemovedPageRefs);
            await repairPDF(this.pdfDocument);
            const pageRefsAfterFix = await this.reorderPagesToPreserveOriginalOrder(pageRefsBeforeFix);
            this.remapConfigAfterPageOrderChange(pageRefsBeforeFix, pageRefsAfterFix);
        } catch (e) {
            LoggerService.error("Det skjedde en feil i fixing script etter redigering av PDF", e);
        }
    }

    private async normalizePdfAfterFix(): Promise<void> {
        const normalizedBytes = await this.pdfDocument.save();
        this.pdfDocument = await PDFDocument.load(normalizedBytes);
        const pageRefsAfterLoad = this.getCurrentPageRefOrder();
        // Prefer the canonical editorVisiblePageRefOrder as the order to preserve, rather than
        // a snapshot of pageRefsAfterLoad taken before this reorder step. A pre-recovery snapshot
        // can itself be stale/broken (e.g. only 7 of 23 pages reachable), most notably on the very
        // first recovery pass run from init() and after onFlattenError() reloads the raw bytes and
        // re-recovers from scratch. Forcing that broken snapshot to the front previously shoved
        // genuinely earlier recovered pages (which the editor's pdfjs-based viewer already renders
        // first) to the back, silently desyncing every page-numbered edit from the page the user
        // actually clicked on.
        // When editorVisiblePageRefOrder is empty (only true before it's ever been set, i.e. this
        // very first recovery pass), there is no established order yet to protect, so skip
        // reordering entirely and accept the natural post-reload order as-is.
        // When editorVisiblePageRefOrder's refs no longer exist at all (e.g. after a later
        // rebuild-via-copyPages mints brand new ref numbers), reorderPagesToPreserveOriginalOrder
        // degrades safely to a no-op: none of its refs match, so it just keeps the current
        // (already correct) order unchanged.
        if (this.editorVisiblePageRefOrder.length > 0 && pageRefsAfterLoad.length > 0) {
            // The save/load roundtrip can expose pages that were previously unreachable from the
            // page tree (e.g. recovered-but-not-yet-visible leafs). reorderPagesToPreserveOriginalOrder
            // keeps the reference refs in their original order and appends any newly exposed
            // pages after them, instead of dropping them like a plain index-mapped copy would.
            await this.reorderPagesToPreserveOriginalOrder(this.editorVisiblePageRefOrder);
        }
        this.font = await this.pdfDocument.embedFont(StandardFonts.TimesRoman);
    }

    getProcessedDocument(): Uint8Array {
        return this.processedDocument;
    }

    async openInNewTab() {
        await this.saveChanges();
        FileUtils.openFile(this.processedDocument, true);
        return this;
    }
}
