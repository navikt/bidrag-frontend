import { PDFArray, PDFDict, PDFDocument, PDFName, PDFString, StandardFonts } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";

import { collectAllDecodedStreamText, countPageLeafObjects, latin1, textToHex } from "../../testing/pdfTestUtils";
import { getLivePageRefs, removeOrphanedContent } from "../OrphanedContentCleanupService";

const REMOVED_PAGE_TEXT = "REMOVED_PAGE_TEXT";
const KEPT_PAGE_TEXT = "KEPT_PAGE_TEXT";
const REMOVED_FIELD_VALUE = "REMOVED_FIELD_VALUE";
const REMOVED_BOOKMARK_TITLE = "REMOVED_BOOKMARK_TITLE";

async function loadTwoPageDocument(): Promise<PDFDocument> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    doc.addPage([595, 842]).drawText(REMOVED_PAGE_TEXT, { x: 50, y: 700, size: 24, font });
    doc.addPage([595, 842]).drawText(KEPT_PAGE_TEXT, { x: 50, y: 700, size: 24, font });
    return PDFDocument.load(await doc.save());
}

describe("getLivePageRefs", () => {
    it("reads the page tree instead of pdf-lib's page cache, which keeps pages removed in place", async () => {
        const doc = await loadTwoPageDocument();
        const [removedPage, keptPage] = doc.getPages();

        doc.removePage(0);

        expect({
            cachedPageRefs: doc.getPages().map((page) => page.ref.toString()),
            livePageRefs: Array.from(getLivePageRefs(doc)),
        }).toEqual({
            cachedPageRefs: [removedPage.ref.toString(), keptPage.ref.toString()],
            livePageRefs: [keptPage.ref.toString()],
        });
    });
});

describe("removeOrphanedContent", () => {
    it("changes nothing in a document without removed pages", async () => {
        const doc = await loadTwoPageDocument();
        const objectCountBefore = doc.context.enumerateIndirectObjects().length;

        const result = removeOrphanedContent(doc);

        expect({
            result,
            objectCountAfter: doc.context.enumerateIndirectObjects().length,
            pageCount: doc.getPageCount(),
        }).toEqual({
            result: {
                removedObjectCount: 0,
                severedPageReferenceCount: 0,
                prunedFormFieldCount: 0,
                removedLinkCount: 0,
                droppedCatalogEntryCount: 0,
                prunedResourceEntryCount: 0,
            },
            objectCountAfter: objectCountBefore,
            pageCount: 2,
        });
    });

    it("deletes a page removed in place together with its content stream", async () => {
        const doc = await loadTwoPageDocument();
        doc.removePage(0);
        expect(collectAllDecodedStreamText(doc)).toContain(textToHex(REMOVED_PAGE_TEXT));

        const result = removeOrphanedContent(doc);
        const reloaded = await PDFDocument.load(await doc.save());

        const allText = collectAllDecodedStreamText(reloaded);
        expect({
            removedAtLeastPageAndContent: result.removedObjectCount >= 2,
            pageLeafObjects: countPageLeafObjects(reloaded),
            containsRemovedPageText: allText.includes(textToHex(REMOVED_PAGE_TEXT)),
            containsKeptPageText: allText.includes(textToHex(KEPT_PAGE_TEXT)),
        }).toEqual({
            removedAtLeastPageAndContent: true,
            pageLeafObjects: 1,
            containsRemovedPageText: false,
            containsKeptPageText: true,
        });
    });

    it("removes link annotations on kept pages that point to a removed page", async () => {
        const doc = await loadTwoPageDocument();
        const [removedPage, keptPage] = doc.getPages();
        const dest = doc.context.obj([removedPage.ref, PDFName.of("Fit")]);
        const linkRef = doc.context.register(
            doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [0, 0, 10, 10], Dest: dest }),
        );
        keptPage.node.set(PDFName.of("Annots"), doc.context.obj([linkRef]));
        doc.removePage(0);

        const result = removeOrphanedContent(doc);

        expect({
            removedLinkCount: result.removedLinkCount,
            keptPageAnnotationCount: doc.context.lookup(keptPage.node.get(PDFName.of("Annots")), PDFArray).size(),
            linkStillInDocument: doc.context.lookup(linkRef) !== undefined,
            removedPageStillInDocument: doc.context.lookup(removedPage.ref) !== undefined,
        }).toEqual({
            removedLinkCount: 1,
            keptPageAnnotationCount: 0,
            linkStillInDocument: false,
            removedPageStillInDocument: false,
        });
    });

    it("cuts any other reference to a removed page so the page is no longer reachable", async () => {
        const doc = await loadTwoPageDocument();
        const [removedPage, keptPage] = doc.getPages();
        const noteRef = doc.context.register(
            doc.context.obj({ Type: "Annot", Subtype: "Text", Rect: [0, 0, 10, 10], P: removedPage.ref }),
        );
        keptPage.node.set(PDFName.of("Annots"), doc.context.obj([noteRef]));
        doc.removePage(0);

        const result = removeOrphanedContent(doc);

        expect({
            severedPageReferenceCount: result.severedPageReferenceCount,
            noteStillPointsToPage: doc.context.lookup(noteRef, PDFDict).has(PDFName.of("P")),
            removedPageStillInDocument: doc.context.lookup(removedPage.ref) !== undefined,
        }).toEqual({
            severedPageReferenceCount: 1,
            noteStillPointsToPage: false,
            removedPageStillInDocument: false,
        });
    });

    it("drops bookmarks and other catalog navigation once pages were removed", async () => {
        const doc = await loadTwoPageDocument();
        const [removedPage] = doc.getPages();
        const outlineItem = doc.context.register(
            doc.context.obj({ Title: PDFString.of(REMOVED_BOOKMARK_TITLE), Dest: [removedPage.ref, "Fit"] }),
        );
        doc.catalog.set(
            PDFName.of("Outlines"),
            doc.context.obj({ Type: "Outlines", First: outlineItem, Last: outlineItem }),
        );
        doc.catalog.set(PDFName.of("PageLabels"), doc.context.obj({ Nums: [0, { P: PDFString.of("A-") }] }));
        doc.removePage(0);

        const result = removeOrphanedContent(doc);
        const savedBytes = await doc.save({ useObjectStreams: false });

        expect({
            droppedCatalogEntryCount: result.droppedCatalogEntryCount,
            hasOutlines: doc.catalog.has(PDFName.of("Outlines")),
            hasPageLabels: doc.catalog.has(PDFName.of("PageLabels")),
            containsBookmarkTitle: latin1(savedBytes).includes(REMOVED_BOOKMARK_TITLE),
        }).toEqual({
            droppedCatalogEntryCount: 2,
            hasOutlines: false,
            hasPageLabels: false,
            containsBookmarkTitle: false,
        });
    });

    it("keeps catalog navigation when no pages were removed", async () => {
        const doc = await loadTwoPageDocument();
        const [firstPage] = doc.getPages();
        const outlineItem = doc.context.register(
            doc.context.obj({ Title: PDFString.of(REMOVED_BOOKMARK_TITLE), Dest: [firstPage.ref, "Fit"] }),
        );
        doc.catalog.set(
            PDFName.of("Outlines"),
            doc.context.obj({ Type: "Outlines", First: outlineItem, Last: outlineItem }),
        );

        const result = removeOrphanedContent(doc);

        expect({
            droppedCatalogEntryCount: result.droppedCatalogEntryCount,
            hasOutlines: doc.catalog.has(PDFName.of("Outlines")),
            bookmarkStillInDocument: doc.context.lookup(outlineItem) !== undefined,
        }).toEqual({ droppedCatalogEntryCount: 0, hasOutlines: true, bookmarkStillInDocument: true });
    });

    it("drops form fields whose widgets were only on removed pages and keeps the others", async () => {
        const source = await PDFDocument.create();
        const [firstPage, secondPage] = [source.addPage([595, 842]), source.addPage([595, 842])];
        const form = source.getForm();
        const removedField = form.createTextField("removedField");
        removedField.setText(REMOVED_FIELD_VALUE);
        removedField.addToPage(firstPage);
        form.createTextField("keptField").addToPage(secondPage);
        const doc = await PDFDocument.load(await source.save({ useObjectStreams: false }));
        doc.removePage(0);

        const result = removeOrphanedContent(doc);
        const savedBytes = await doc.save({ useObjectStreams: false });
        const reloaded = await PDFDocument.load(savedBytes);

        const savedContent = latin1(savedBytes).toUpperCase() + collectAllDecodedStreamText(reloaded);
        expect({
            prunedFormFieldCount: result.prunedFormFieldCount,
            remainingFields: reloaded
                .getForm()
                .getFields()
                .map((field) => field.getName()),
            containsRemovedFieldValue:
                savedContent.includes(REMOVED_FIELD_VALUE) || savedContent.includes(textToHex(REMOVED_FIELD_VALUE)),
        }).toEqual({
            prunedFormFieldCount: 1,
            remainingFields: ["keptField"],
            containsRemovedFieldValue: false,
        });
    });
});
