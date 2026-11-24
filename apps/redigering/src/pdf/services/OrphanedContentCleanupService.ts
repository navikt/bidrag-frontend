import { LoggerService } from "@bidrag/common";
import {
    PDFArray,
    type PDFContext,
    PDFDict,
    type PDFDocument,
    PDFName,
    PDFNull,
    type PDFObject,
    PDFPageLeaf,
    PDFRef,
    PDFStream,
} from "@cantoo/pdf-lib";

import { pruneUnusedPageResources } from "./ResourcePruningService";

/**
 * pdf-lib serializes every indirect object in its context, whether or not the page tree still
 * uses it. Pages removed in place, and page leaves that copyPages() drags in through link
 * destinations, therefore survive in the saved bytes even though no viewer shows them. In a
 * masking tool that leaks removed pages and the unmasked originals of masked pages, so the
 * document has to be reduced to the objects the visible pages actually need before saving.
 */

const ANNOTS = PDFName.of("Annots");
const ACRO_FORM = PDFName.of("AcroForm");
const FIELDS = PDFName.of("Fields");
const KIDS = PDFName.of("Kids");
const SUBTYPE = PDFName.of("Subtype");
const WIDGET = PDFName.of("Widget");
const LINK = PDFName.of("Link");
const DEST = PDFName.of("Dest");
const ACTION = PDFName.of("A");
const ACTION_DESTINATION = PDFName.of("D");
// Document-level navigation and structure that can hold text from removed pages (bookmark titles,
// /Alt and /ActualText, named destinations, page labels). Only rebuilt documents lack them, so
// they are dropped whenever the document still contains pages outside the page tree.
const CATALOG_ENTRIES_REFERENCING_PAGES = [
    "Outlines",
    "Names",
    "Dests",
    "StructTreeRoot",
    "MarkInfo",
    "PageLabels",
    "Threads",
    "OpenAction",
].map((name) => PDFName.of(name));

export interface IOrphanedContentCleanupResult {
    removedObjectCount: number;
    severedPageReferenceCount: number;
    prunedFormFieldCount: number;
    removedLinkCount: number;
    droppedCatalogEntryCount: number;
    prunedResourceEntryCount: number;
}

function getLivePageLeaves(pdfDocument: PDFDocument): Map<string, PDFPageLeaf> {
    const livePageLeaves = new Map<string, PDFPageLeaf>();
    pdfDocument.catalog.Pages().traverse((node, ref) => {
        if (node instanceof PDFPageLeaf) {
            livePageLeaves.set(ref.toString(), node);
        }
    });
    return livePageLeaves;
}

/**
 * Returns the refs of the page leaves reachable from the catalog's page tree. Reads the tree
 * directly instead of PDFDocument.getPages(), whose cache pdf-lib does not invalidate after
 * removePage().
 */
export function getLivePageRefs(pdfDocument: PDFDocument): Set<string> {
    return new Set(getLivePageLeaves(pdfDocument).keys());
}

/**
 * Removes everything that is not needed to render the pages in the page tree: document-level
 * navigation and structure when pages were removed, links and form fields that only point to
 * removed pages, resource entries the kept pages never use, remaining references to page leaves
 * outside the page tree, and finally all objects no longer reachable from the trailer.
 */
export function removeOrphanedContent(pdfDocument: PDFDocument): IOrphanedContentCleanupResult {
    const context = pdfDocument.context;
    const livePageLeaves = getLivePageLeaves(pdfDocument);
    const deadPageRefs = new Set(
        context
            .enumerateIndirectObjects()
            .filter(([ref, obj]) => obj instanceof PDFPageLeaf && !livePageLeaves.has(ref.toString()))
            .map(([ref]) => ref.toString()),
    );
    const liveLeaves = Array.from(livePageLeaves.values());

    const droppedCatalogEntryCount =
        deadPageRefs.size > 0 ? dropCatalogEntriesReferencingPages(pdfDocument.catalog) : 0;
    const removedLinkCount = removeLinksToDeadPages(context, liveLeaves, deadPageRefs);
    const prunedFormFieldCount = pruneFormFieldsWithoutLiveWidgets(
        context,
        pdfDocument.catalog,
        collectLiveAnnotationRefs(context, liveLeaves),
    );
    const prunedResourceEntryCount = pruneUnusedPageResources(context, liveLeaves);
    const { reachableRefs, severedPageReferenceCount } = collectReachableRefs(context, deadPageRefs);

    const unreachableRefs = context
        .enumerateIndirectObjects()
        .map(([ref]) => ref)
        .filter((ref) => !reachableRefs.has(ref.toString()));
    unreachableRefs.forEach((ref) => {
        context.delete(ref);
    });

    const result: IOrphanedContentCleanupResult = {
        removedObjectCount: unreachableRefs.length,
        severedPageReferenceCount,
        prunedFormFieldCount,
        removedLinkCount,
        droppedCatalogEntryCount,
        prunedResourceEntryCount,
    };
    if (Object.values(result).some((count) => count > 0)) {
        LoggerService.info(
            `removeOrphanedContent livePageCount=${livePageLeaves.size} deadPageLeafCount=${deadPageRefs.size} ${Object.entries(
                result,
            )
                .map(([key, count]) => `${key}=${count}`)
                .join(" ")}`,
        );
    }
    return result;
}

function dropCatalogEntriesReferencingPages(catalog: PDFDict): number {
    const present = CATALOG_ENTRIES_REFERENCING_PAGES.filter((entry) => catalog.has(entry));
    present.forEach((entry) => {
        catalog.delete(entry);
    });
    return present.length;
}

function removeLinksToDeadPages(context: PDFContext, liveLeaves: PDFPageLeaf[], deadPageRefs: Set<string>): number {
    let removedCount = 0;
    for (const leaf of liveLeaves) {
        const annots = context.lookup(leaf.get(ANNOTS));
        if (!(annots instanceof PDFArray)) continue;
        for (let index = annots.size() - 1; index >= 0; index--) {
            const annot = context.lookup(annots.get(index));
            if (
                annot instanceof PDFDict &&
                annot.get(SUBTYPE) === LINK &&
                linksToDeadPage(context, annot, deadPageRefs)
            ) {
                annots.remove(index);
                removedCount += 1;
            }
        }
    }
    return removedCount;
}

function linksToDeadPage(context: PDFContext, link: PDFDict, deadPageRefs: Set<string>): boolean {
    const action = context.lookup(link.get(ACTION));
    const destination = context.lookup(
        link.get(DEST) ?? (action instanceof PDFDict ? action.get(ACTION_DESTINATION) : undefined),
    );
    return destination instanceof PDFArray && isDeadPageRef(destination.get(0), deadPageRefs);
}

function collectLiveAnnotationRefs(context: PDFContext, liveLeaves: PDFPageLeaf[]): Set<string> {
    const liveAnnotationRefs = new Set<string>();
    liveLeaves.forEach((leaf) => {
        const annots = context.lookup(leaf.get(ANNOTS));
        if (annots instanceof PDFArray) {
            annots.asArray().forEach((annot) => {
                if (annot instanceof PDFRef) {
                    liveAnnotationRefs.add(annot.toString());
                }
            });
        }
    });
    return liveAnnotationRefs;
}

// A field value (/V) and its appearance stream stay reachable through /AcroForm even when every
// widget showing it was on a removed page, so such fields must be dropped explicitly.
function pruneFormFieldsWithoutLiveWidgets(
    context: PDFContext,
    catalog: PDFDict,
    liveAnnotationRefs: Set<string>,
): number {
    const acroForm = context.lookup(catalog.get(ACRO_FORM));
    if (!(acroForm instanceof PDFDict)) {
        return 0;
    }
    const fields = context.lookup(acroForm.get(FIELDS));
    if (!(fields instanceof PDFArray)) {
        return 0;
    }
    return pruneFieldArray(context, fields, liveAnnotationRefs);
}

function pruneFieldArray(context: PDFContext, fields: PDFArray, liveAnnotationRefs: Set<string>): number {
    let prunedCount = 0;
    for (let index = fields.size() - 1; index >= 0; index--) {
        const { keep, prunedDescendantCount } = evaluateField(context, fields.get(index), liveAnnotationRefs);
        if (keep) {
            prunedCount += prunedDescendantCount;
        } else {
            fields.remove(index);
            prunedCount += 1;
        }
    }
    return prunedCount;
}

function evaluateField(
    context: PDFContext,
    fieldObject: PDFObject,
    liveAnnotationRefs: Set<string>,
): { keep: boolean; prunedDescendantCount: number } {
    if (fieldObject instanceof PDFRef && liveAnnotationRefs.has(fieldObject.toString())) {
        return { keep: true, prunedDescendantCount: 0 };
    }
    const field = context.lookup(fieldObject);
    if (!(field instanceof PDFDict)) {
        return { keep: false, prunedDescendantCount: 0 };
    }
    const kids = context.lookup(field.get(KIDS));
    if (!(kids instanceof PDFArray) || kids.size() === 0) {
        // Fields without any widget are kept; a widget that is not on a live page is dropped.
        return { keep: field.get(SUBTYPE) !== WIDGET, prunedDescendantCount: 0 };
    }
    const prunedDescendantCount = pruneFieldArray(context, kids, liveAnnotationRefs);
    return { keep: kids.size() > 0, prunedDescendantCount };
}

function collectReachableRefs(
    context: PDFContext,
    deadPageRefs: Set<string>,
): { reachableRefs: Set<string>; severedPageReferenceCount: number } {
    const { Root, Info, Encrypt, ID } = context.trailerInfo;
    const pending: PDFObject[] = [Root, Info, Encrypt, ID].filter((obj): obj is PDFObject => obj !== undefined);
    const reachableRefs = new Set<string>();
    let severedPageReferenceCount = 0;

    while (pending.length > 0) {
        const current = pending.pop();
        if (current instanceof PDFRef) {
            const key = current.toString();
            const resolved = context.lookup(current);
            if (!reachableRefs.has(key) && resolved !== undefined) {
                reachableRefs.add(key);
                pending.push(resolved);
            }
        } else if (current instanceof PDFDict) {
            current.entries().forEach(([key, value]) => {
                if (isDeadPageRef(value, deadPageRefs)) {
                    current.delete(key);
                    severedPageReferenceCount += 1;
                } else {
                    pending.push(value);
                }
            });
        } else if (current instanceof PDFArray) {
            current.asArray().forEach((value, index) => {
                if (isDeadPageRef(value, deadPageRefs)) {
                    current.set(index, PDFNull);
                    severedPageReferenceCount += 1;
                } else {
                    pending.push(value);
                }
            });
        } else if (current instanceof PDFStream) {
            pending.push(current.dict);
        }
    }

    return { reachableRefs, severedPageReferenceCount };
}

function isDeadPageRef(value: PDFObject, deadPageRefs: Set<string>): boolean {
    return value instanceof PDFRef && deadPageRefs.has(value.toString());
}
