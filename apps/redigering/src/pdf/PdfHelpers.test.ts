import { type PDFDict, PDFDocument, PDFName, type PDFPageLeaf, PDFRef, RotationTypes } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";

import { hasInvalidXObject, repairBrokenParentChain } from "./PdfHelpers";

describe("repairBrokenParentChain", () => {
    it("reparents a page leaf whose Parent points to a plain dict instead of a page tree node", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([100, 100]);
        const brokenPage = pdfDoc.addPage([100, 100]);

        // Corrupt the document the way we've seen in the wild: the leaf's /Parent points at
        // an indirect object that resolves to a plain dictionary — one with no `ascend`
        // method (unlike a real PDFPageTree/PDFPageLeaf) — instead of the shared page tree.
        const bogusParentRef = pdfDoc.context.register(pdfDoc.context.obj({}) as PDFDict);
        (brokenPage.node as PDFPageLeaf).set(PDFName.of("Parent"), bogusParentRef);

        // Sanity check that this really does reproduce the "Parent.ascend is not a function"
        // failure mode before asserting the fix.
        expect(() => brokenPage.getRotation()).toThrow();

        repairBrokenParentChain(pdfDoc);

        expect(() => brokenPage.getRotation()).not.toThrow();
        const repairedParent = (brokenPage.node as PDFPageLeaf).get(PDFName.of("Parent"));
        expect(repairedParent).toBeInstanceOf(PDFRef);
        expect(repairedParent).not.toEqual(bogusParentRef);
    });

    it("preserves inherited Resources/MediaBox/Rotate when reparenting a broken leaf", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([200, 300]);
        const secondPage = pdfDoc.addPage([200, 300]);
        secondPage.setRotation({ type: RotationTypes.Degrees, angle: 90 });

        // Break the parent chain the same way as above.
        const bogusParentRef = pdfDoc.context.register(pdfDoc.context.obj({}) as PDFDict);
        (secondPage.node as PDFPageLeaf).set(PDFName.of("Parent"), bogusParentRef);

        repairBrokenParentChain(pdfDoc);

        expect(secondPage.getRotation().angle).toBe(90);
        expect(secondPage.getWidth()).toBe(200);
        expect(secondPage.getHeight()).toBe(300);
    });

    it("does nothing when the page tree is already healthy", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([100, 100]);
        pdfDoc.addPage([100, 100]);

        const refsBefore = pdfDoc
            .getPages()
            .map((page) => (page.node as PDFPageLeaf).get(PDFName.of("Parent"))?.toString());
        repairBrokenParentChain(pdfDoc);
        const refsAfter = pdfDoc
            .getPages()
            .map((page) => (page.node as PDFPageLeaf).get(PDFName.of("Parent"))?.toString());

        expect(refsAfter).toEqual(refsBefore);
    });
});

describe("hasInvalidXObject", () => {
    it("returns false for a page with no XObject resources", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([100, 100]);

        expect(hasInvalidXObject(pdfDoc)).toBe(false);
    });

    it("returns true when an XObject entry resolves to a PDFDict instead of a stream", async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([100, 100]);

        // Simulate the corruption this check was added for: an /XObject entry whose
        // reference resolves to a plain dictionary instead of a PDFStream, which used to
        // crash pdf-lib's form.flatten() with "Expected instance of PDFStream, but got
        // instance of PDFDict".
        const invalidXObjectRef = pdfDoc.context.register(pdfDoc.context.obj({}) as PDFDict);
        const xObjectDict = pdfDoc.context.obj({ Im1: invalidXObjectRef });
        const resourcesDict = pdfDoc.context.obj({ XObject: xObjectDict });
        page.node.set(PDFName.of("Resources"), resourcesDict);

        expect(hasInvalidXObject(pdfDoc)).toBe(true);
    });
});
