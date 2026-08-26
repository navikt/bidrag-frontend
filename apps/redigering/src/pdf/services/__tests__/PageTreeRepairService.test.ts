import { PDFDocument } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";

import { EditDocumentMetadata } from "../../../types/EditorTypes";
import {
    getCurrentPageRefOrder,
    remapConfigAfterPageOrderChange,
    restoreEditorVisiblePageOrder,
} from "../PageTreeRepairService";

function emptyConfig(overrides: Partial<EditDocumentMetadata> = {}): EditDocumentMetadata {
    return { items: [], removedPages: [], pageRotations: {}, ...overrides };
}

describe("getCurrentPageRefOrder", () => {
    it("returns page ref strings in document order", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([100, 100]);
        pdfDoc.addPage([100, 100]);

        const refs = getCurrentPageRefOrder(pdfDoc);
        expect(refs).toHaveLength(2);
        expect(refs[0]).not.toEqual(refs[1]);
    });
});

describe("restoreEditorVisiblePageOrder", () => {
    it("reorders the page tree to match the given ref order", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([100, 100]);
        pdfDoc.addPage([200, 200]);
        pdfDoc.addPage([300, 300]);

        const [refA, refB, refC] = getCurrentPageRefOrder(pdfDoc);
        // Editor originally showed the pages in a different order than the current tree.
        const editorOrder = [refC, refA, refB];

        const reordered = restoreEditorVisiblePageOrder(pdfDoc, editorOrder);
        expect(reordered).toBe(true);

        // pdf-lib caches the flattened page array from the first getPages() traversal and
        // does not invalidate it after catalog.insertLeafNode() mutates the tree, so a
        // save/load roundtrip is needed to observe the new order — matching how
        // normalizePdfAfterFix() must always follow a reorder in the real pipeline.
        const reloadedDoc = await PDFDocument.load(await pdfDoc.save());

        expect(getCurrentPageRefOrder(reloadedDoc)).toEqual(editorOrder);
        expect(reloadedDoc.getPages().map((p) => p.getWidth())).toEqual([300, 100, 200]);
    });

    it("returns false and does not change order when already matching", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([100, 100]);
        pdfDoc.addPage([200, 200]);

        const currentOrder = getCurrentPageRefOrder(pdfDoc);
        const reordered = restoreEditorVisiblePageOrder(pdfDoc, currentOrder);

        expect(reordered).toBe(false);
        expect(getCurrentPageRefOrder(pdfDoc)).toEqual(currentOrder);
    });

    it("returns false when editorVisiblePageRefOrder is empty", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([100, 100]);

        expect(restoreEditorVisiblePageOrder(pdfDoc, [])).toBe(false);
    });
});

describe("remapConfigAfterPageOrderChange", () => {
    it("translates removedPages and masking item page numbers to the new order", () => {
        const config = emptyConfig({
            removedPages: [1, 3],
            items: [{ pageNumber: 2, coordinates: { x: 0, y: 0, width: 10, height: 10 } } as never],
        });

        // Page that was #1 before is now #3, #2 stays #2, #3 is now #1.
        const before = ["refA", "refB", "refC"];
        const after = ["refC", "refB", "refA"];

        const remapped = remapConfigAfterPageOrderChange(config, before, after);

        expect(remapped.removedPages).toEqual([1, 3]); // old 1->3, old 3->1, sorted
        expect(remapped.items[0].pageNumber).toBe(2);
    });

    it("keeps pageRotations bound to the original visual page numbers", () => {
        const config = emptyConfig({ pageRotations: { 1: 90 } });
        const remapped = remapConfigAfterPageOrderChange(config, ["refA", "refB"], ["refB", "refA"]);

        expect(remapped.pageRotations).toEqual({ 1: 90 });
    });

    it("returns the config unchanged when before/after ref lists are empty", () => {
        const config = emptyConfig({ removedPages: [2] });
        expect(remapConfigAfterPageOrderChange(config, [], [])).toBe(config);
    });
});
