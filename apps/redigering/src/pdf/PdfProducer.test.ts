import {
    decodePDFRawStream,
    PDFDict,
    PDFDocument,
    PDFName,
    PDFPage,
    PDFRawStream,
    RotationTypes,
    StandardFonts,
} from "@cantoo/pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IMaskingItemProps } from "../components/masking/MaskingItem";
import { PdfProducer } from "./PdfProducer";
import { IRenderedPdfPage } from "./services/PdfRenderer";

// pdf2Image (the real implementation behind renderPdfPagesToImages) rasterizes via
// pdfjs-dist + <canvas>, which requires the "canvas" native module that isn't installed for
// this test environment. Mock it with a deterministic, page-count-aware fake so these tests
// only exercise PdfProducer's own page-replacement logic, not pdfjs/canvas rendering fidelity.
vi.mock("./services/PdfRenderer", () => ({
    renderPdfPagesToImages: vi.fn(),
}));

import { renderPdfPagesToImages } from "./services/PdfRenderer";

const SECRET_TEXT = "SECRET_TEXT_PAGE_1";
const PUBLIC_TEXT = "PUBLIC_TEXT_PAGE_2";

// Smallest possible valid PNG (1x1 transparent pixel), used as a stand-in for a rasterized page.
const ONE_PIXEL_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Smallest possible valid JPEG (1x1 pixel).
const ONE_PIXEL_JPEG_BASE64 =
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function base64ToUint8Array(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function buildSourcePdf(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const page1 = doc.addPage([595, 842]);
    page1.drawText(SECRET_TEXT, { x: 50, y: 700, size: 24, font });

    const page2 = doc.addPage([595, 842]);
    page2.drawText(PUBLIC_TEXT, { x: 50, y: 700, size: 24, font });

    return doc.save();
}

function getResourceSubDict(page: PDFPage, subDictName: "Font" | "XObject"): PDFDict | undefined {
    // Mirrors the pattern used in PdfHelpers.pageHasInvalidXObject: read Resources via
    // page.node.get() (not page.node.Resources()) so a broken/inherited parent chain can't
    // throw here, and resolve refs manually.
    const resourcesObj = page.node.get(PDFName.of("Resources"));
    const resources =
        resourcesObj instanceof PDFDict ? resourcesObj : page.node.context.lookupMaybe(resourcesObj, PDFDict);
    const subDictObj = resources?.get(PDFName.of(subDictName));
    if (subDictObj instanceof PDFDict) {
        return subDictObj;
    }
    return subDictObj ? page.node.context.lookupMaybe(subDictObj, PDFDict) : undefined;
}

function getInternalPdfDocument(producer: PdfProducer): PDFDocument {
    return (producer as unknown as { pdfDocument: PDFDocument }).pdfDocument;
}

function getRotationInternals(producer: PdfProducer): {
    captureBasePageRotations: () => void;
    applyPageRotations: (pageRotations?: Record<number, number>, excludedPageNumbers?: Set<number>) => void;
} {
    const internals = producer as unknown as {
        captureBasePageRotations: () => void;
        applyPageRotations: (pageRotations?: Record<number, number>, excludedPageNumbers?: Set<number>) => void;
    };
    // Destructuring these off `producer` loses their `this` binding, so bind explicitly -
    // both methods read/write instance fields like `this.pdfDocument` internally.
    return {
        captureBasePageRotations: internals.captureBasePageRotations.bind(internals),
        applyPageRotations: internals.applyPageRotations.bind(internals),
    };
}

async function buildRotatedSourcePdf(initialRotationAngle: number): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]);
    page.drawText(SECRET_TEXT, { x: 50, y: 700, size: 24, font });
    page.setRotation({ type: RotationTypes.Degrees, angle: initialRotationAngle });
    return doc.save();
}

// PDF viewers/extractors show text drawn via Tj operators as a hex- or literal-string operand,
// not as the plain characters you'd get from string search. Content streams are also Flate
// compressed by default. Decompress every stream object and check for the hex-encoded form of a
// piece of text to prove it is truly gone (or truly still present), rather than trusting that a
// naive substring search on the raw file bytes would ever have found it in the first place.
function textToHex(text: string): string {
    return Array.from(text)
        .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}

function decodeStreamBytesToString(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((byte) => String.fromCharCode(byte))
        .join("");
}

function collectAllDecodedStreamText(doc: PDFDocument): string {
    let combined = "";
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
        if (obj instanceof PDFRawStream) {
            try {
                combined += decodeStreamBytesToString(decodePDFRawStream(obj).decode());
            } catch {
                // Not every stream is decodable (e.g. embedded font binaries) - irrelevant to
                // finding leftover drawn text, so skip and keep scanning the rest.
            }
        }
    }
    return combined.toUpperCase();
}

describe("PdfProducer masking security guarantees", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(renderPdfPagesToImages).mockImplementation(async (pdfBytes: Uint8Array) => {
            const tempDoc = await PDFDocument.load(pdfBytes);
            const pageCount = tempDoc.getPageCount();
            const images = new Map<number, IRenderedPdfPage>();
            for (let i = 0; i < pageCount; i++) {
                images.set(i, { blob: base64ToUint8Array(ONE_PIXEL_PNG_BASE64), width: 100, height: 100 });
            }
            return { images, pageCount };
        });

        // pdf-lib's PNG embedder depends on @pdf-lib/upng, whose CJS/ESM interop is broken under
        // Vitest's SSR module loader in this environment (UPNG.decode is not a function), even
        // though it works fine at runtime in the browser. Redirect embedPng to embedJpg with a
        // real, valid JPEG so the resulting document still gets a genuine Image XObject (proving
        // the masked page truly has image content, not just a mocked no-op), without depending on
        // the broken PNG decode path.
        vi.spyOn(PDFDocument.prototype, "embedPng").mockImplementation(function (this: PDFDocument) {
            return this.embedJpg(base64ToUint8Array(ONE_PIXEL_JPEG_BASE64));
        });
    });

    it("replaces a masked page with a rasterized image and strips its original text resources", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });

        const maskingItems = [
            { pageNumber: 1, coordinates: { x: 0, y: 0, width: 595, height: 842 } } as unknown as IMaskingItemProps,
        ];

        producer.maskPages(maskingItems);
        await producer.convertMaskedPagesToImage(maskingItems);

        expect(renderPdfPagesToImages).toHaveBeenCalled();

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPageCount()).toBe(2);

        const maskedPage = resultDoc.getPage(0);
        const maskedFontDict = getResourceSubDict(maskedPage, "Font");
        const maskedXObjectDict = getResourceSubDict(maskedPage, "XObject");

        // No Font resource means the masked page can never show/extract text again, by
        // construction: it's a brand new page containing only a drawn image.
        expect(maskedFontDict?.keys().length ?? 0).toBe(0);
        expect(maskedXObjectDict?.keys().length ?? 0).toBeGreaterThan(0);
    });

    it("leaves unmasked pages untouched, preserving their original extractable text", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });

        const maskingItems = [
            { pageNumber: 1, coordinates: { x: 0, y: 0, width: 595, height: 842 } } as unknown as IMaskingItemProps,
        ];

        producer.maskPages(maskingItems);
        await producer.convertMaskedPagesToImage(maskingItems);

        const resultDoc = getInternalPdfDocument(producer);
        const unmaskedPage = resultDoc.getPage(1);
        const unmaskedFontDict = getResourceSubDict(unmaskedPage, "Font");

        expect(unmaskedFontDict?.keys().length ?? 0).toBeGreaterThan(0);
    });

    it("does not convert any page when no masking items are given", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });

        await producer.convertMaskedPagesToImage([]);

        expect(renderPdfPagesToImages).not.toHaveBeenCalled();

        const resultDoc = getInternalPdfDocument(producer);
        const page1FontDict = getResourceSubDict(resultDoc.getPage(0), "Font");
        expect(page1FontDict?.keys().length ?? 0).toBeGreaterThan(0);
    });

    it("produces exactly one page per original page index (never both the image and the original)", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });

        const maskingItems = [
            { pageNumber: 1, coordinates: { x: 0, y: 0, width: 595, height: 842 } } as unknown as IMaskingItemProps,
            { pageNumber: 2, coordinates: { x: 0, y: 0, width: 595, height: 842 } } as unknown as IMaskingItemProps,
        ];

        producer.maskPages(maskingItems);
        await producer.convertMaskedPagesToImage(maskingItems);

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPageCount()).toBe(2);

        for (const page of resultDoc.getPages()) {
            const fontDict = getResourceSubDict(page, "Font");
            const xObjectDict = getResourceSubDict(page, "XObject");
            expect(fontDict?.keys().length ?? 0).toBe(0);
            expect(xObjectDict?.keys().length ?? 0).toBeGreaterThan(0);
        }
    });
});

describe("PdfProducer page removal security guarantees", () => {
    it("permanently deletes a page's content so it cannot be recovered from the saved PDF", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });

        await producer.removePages([1]);

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPageCount()).toBe(1);

        const savedBytes = await resultDoc.save();
        const reloaded = await PDFDocument.load(savedBytes);
        const allText = collectAllDecodedStreamText(reloaded);

        // The removed page's text must not exist anywhere in the saved document, in any form.
        expect(allText).not.toContain(textToHex(SECRET_TEXT));
        // Sanity check the scanning technique itself: the remaining page's text must still be
        // found this way, proving the absence of SECRET_TEXT above is a real result and not a
        // false negative from a broken search.
        expect(allText).toContain(textToHex(PUBLIC_TEXT));
    });

    it("keeps the remaining page's content fully intact after removal", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });

        await producer.removePages([1]);

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPageCount()).toBe(1);
        const remainingPageFontDict = getResourceSubDict(resultDoc.getPage(0), "Font");
        expect(remainingPageFontDict?.keys().length ?? 0).toBeGreaterThan(0);
    });

    it("does not remove any page when the requested page number is out of range", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });

        await producer.removePages([99]);

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPageCount()).toBe(2);

        const savedBytes = await resultDoc.save();
        const reloaded = await PDFDocument.load(savedBytes);
        const allText = collectAllDecodedStreamText(reloaded);
        expect(allText).toContain(textToHex(SECRET_TEXT));
        expect(allText).toContain(textToHex(PUBLIC_TEXT));
    });
});

describe("PdfProducer page rotation", () => {
    it("rotates a page by the requested delta from an unrotated base", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });
        const { applyPageRotations } = getRotationInternals(producer);

        applyPageRotations({ 1: 90 });

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPage(0).getRotation().angle).toBe(90);
    });

    it("adds the requested delta on top of the page's original rotation instead of overwriting it", async () => {
        const sourceBytes = await buildRotatedSourcePdf(90);
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });
        const { captureBasePageRotations, applyPageRotations } = getRotationInternals(producer);

        captureBasePageRotations();
        applyPageRotations({ 1: 90 });

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPage(0).getRotation().angle).toBe(180);
    });

    it("normalizes rotation deltas beyond 360 degrees to their equivalent angle", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });
        const { applyPageRotations } = getRotationInternals(producer);

        applyPageRotations({ 1: 450 });

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPage(0).getRotation().angle).toBe(90);
    });

    it("normalizes negative rotation deltas to their positive equivalent angle", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });
        const { applyPageRotations } = getRotationInternals(producer);

        applyPageRotations({ 1: -90 });

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPage(0).getRotation().angle).toBe(270);
    });

    it("leaves excluded pages unrotated even when a rotation is requested for them", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });
        const { applyPageRotations } = getRotationInternals(producer);

        applyPageRotations({ 1: 90 }, new Set([1]));

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPage(0).getRotation().angle).toBe(0);
    });

    it("only rotates the targeted page, leaving other pages untouched", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });
        const { applyPageRotations } = getRotationInternals(producer);

        applyPageRotations({ 1: 90 });

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPage(1).getRotation().angle).toBe(0);
    });
});
