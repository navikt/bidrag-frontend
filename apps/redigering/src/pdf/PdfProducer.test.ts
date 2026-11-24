import {
    PDFDict,
    PDFDocument,
    PDFName,
    type PDFPage,
    type PDFRef,
    RotationTypes,
    StandardFonts,
} from "@cantoo/pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IMaskingItemProps } from "../components/masking/MaskingItem";
import type { EditDocumentMetadata } from "../types/EditorTypes";
import { PdfProducer } from "./PdfProducer";
import type { IRenderedPdfPage } from "./services/PdfRenderer";
import {
    buildSharedResourcesPdf,
    collectAllDecodedStreamText,
    countPageLeafObjects,
    latin1,
    SHARED_RESOURCE_FORM_TEXTS,
    SHARED_RESOURCE_JPEG_MARKERS,
    textToHex,
} from "./testing/pdfTestUtils";

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
    applyPageRotations: (pageRotations?: Record<number, number>) => void;
} {
    const internals = producer as unknown as {
        captureBasePageRotations: () => void;
        applyPageRotations: (pageRotations?: Record<number, number>) => void;
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

const LINKED_PAGE_TEXTS = ["LINKED_PAGE_1_KEPT", "LINKED_PAGE_2_MASKED", "LINKED_PAGE_3_REMOVED", "LINKED_PAGE_4_KEPT"];

function addLinkAnnotation(doc: PDFDocument, fromPage: PDFPage, toPageRef: PDFRef): void {
    const link = doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [0, 0, 100, 100],
        Dest: [toPageRef, PDFName.of("Fit")],
    });
    fromPage.node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(link)]));
}

// Link destinations make copyPages() drag the target page leaf into the copy as an object outside
// the page tree. This is how masked originals and removed pages ended up in production output.
async function buildLinkedSourcePdf(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = LINKED_PAGE_TEXTS.map((text) => {
        const page = doc.addPage([595, 842]);
        page.drawText(text, { x: 50, y: 700, size: 24, font });
        return page;
    });
    addLinkAnnotation(doc, pages[0], pages[2].ref);
    addLinkAnnotation(doc, pages[3], pages[1].ref);
    return doc.save();
}

async function buildThreePageSourcePdf(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]);
    doc.addPage([595, 842]);
    doc.addPage([595, 842]);
    return doc.save();
}

function mockPageRasterization(): void {
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
}

describe("PdfProducer masking security guarantees", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPageRasterization();
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

describe("PdfProducer full pipeline output", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPageRasterization();
    });

    async function produceSavedDocument(
        sourceBytes: Uint8Array,
        config: EditDocumentMetadata,
    ): Promise<{ output: PDFDocument; savedBytes: Uint8Array }> {
        const producer = await new PdfProducer(sourceBytes).init(config);
        await producer.process();
        await producer.saveChanges();
        const savedBytes = producer.getProcessedDocument();
        return { output: await PDFDocument.load(savedBytes), savedBytes };
    }

    it("leaves neither removed pages nor unmasked originals in the saved bytes when pages link to each other", async () => {
        const maskItem = {
            pageNumber: 2,
            coordinates: { x: 0, y: 0, width: 595, height: 842 },
        } as unknown as IMaskingItemProps;

        const { output } = await produceSavedDocument(await buildLinkedSourcePdf(), {
            items: [maskItem],
            removedPages: [3],
            pageRotations: {},
        });

        const allText = collectAllDecodedStreamText(output);
        const [keptFirst, masked, removed, keptLast] = LINKED_PAGE_TEXTS.map(textToHex);
        expect({
            pageCount: output.getPageCount(),
            pageLeafObjects: countPageLeafObjects(output),
            containsMaskedOriginal: allText.includes(masked),
            containsRemovedPage: allText.includes(removed),
            containsKeptFirst: allText.includes(keptFirst),
            containsKeptLast: allText.includes(keptLast),
        }).toEqual({
            pageCount: 3,
            pageLeafObjects: 3,
            containsMaskedOriginal: false,
            containsRemovedPage: false,
            containsKeptFirst: true,
            containsKeptLast: true,
        });
    });

    const pageTwoEdits = [
        { mode: "removed", config: { items: [], removedPages: [2], pageRotations: {} }, expectedPageCount: 2 },
        {
            mode: "masked",
            config: {
                items: [
                    {
                        pageNumber: 2,
                        coordinates: { x: 0, y: 0, width: 595, height: 842 },
                    } as unknown as IMaskingItemProps,
                ],
                removedPages: [],
                pageRotations: {},
            },
            expectedPageCount: 3,
        },
    ];
    const sharedXObjectKinds = [
        {
            kind: "form" as const,
            markers: SHARED_RESOURCE_FORM_TEXTS.map(textToHex),
            searchableContent: (output: PDFDocument) => collectAllDecodedStreamText(output),
        },
        {
            // pdf-lib cannot decode JPEG data, so search the raw saved bytes instead.
            kind: "jpeg" as const,
            markers: SHARED_RESOURCE_JPEG_MARKERS,
            searchableContent: (_output: PDFDocument, savedBytes: Uint8Array) => latin1(savedBytes),
        },
    ];

    it.each(
        sharedXObjectKinds.flatMap((xObjectKind) => pageTwoEdits.map((edit) => ({ ...xObjectKind, ...edit }))),
    )("drops the $kind XObject only page 2 used from shared page resources when page 2 is $mode", async ({
        kind,
        markers,
        searchableContent,
        config,
        expectedPageCount,
    }) => {
        const { output, savedBytes } = await produceSavedDocument(await buildSharedResourcesPdf(kind), config);

        const content = searchableContent(output, savedBytes);
        const [keptFirst, onlyOnPageTwo, keptLast] = markers;
        expect({
            pageCount: output.getPageCount(),
            containsPageTwoContent: content.includes(onlyOnPageTwo),
            containsKeptFirst: content.includes(keptFirst),
            containsKeptLast: content.includes(keptLast),
        }).toEqual({
            pageCount: expectedPageCount,
            containsPageTwoContent: false,
            containsKeptFirst: true,
            containsKeptLast: true,
        });
    });

    it("applies rotations by original page number only once when earlier pages are removed", async () => {
        const { output } = await produceSavedDocument(await buildThreePageSourcePdf(), {
            items: [],
            removedPages: [1],
            pageRotations: { 2: 90 },
        });

        expect(output.getPages().map((page) => page.getRotation().angle)).toEqual([90, 0]);
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

    it("only rotates the targeted page, leaving other pages untouched", async () => {
        const sourceBytes = await buildSourcePdf();
        const producer = await new PdfProducer(sourceBytes).init({ items: [], removedPages: [] });
        const { applyPageRotations } = getRotationInternals(producer);

        applyPageRotations({ 1: 90 });

        const resultDoc = getInternalPdfDocument(producer);
        expect(resultDoc.getPage(1).getRotation().angle).toBe(0);
    });
});
