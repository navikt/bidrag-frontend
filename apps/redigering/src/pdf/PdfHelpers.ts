import { LoggerService } from "@bidrag/common";
import {
    PDFArray,
    PDFDict,
    PDFDocument,
    PDFName,
    type PDFObject,
    type PDFPage,
    PDFPageLeaf,
    PDFRawStream,
    PDFRef,
    PDFStream,
} from "@cantoo/pdf-lib";

import type { PdfDocumentType } from "../components/utils/types";
export const PDF_EDITOR_PRODUCER = "bidrag-dokument-redigering-ui";
export const PDF_EDITOR_CREATOR = "NAV - Arbeids- og velferdsetaten";

export class PdfProducerHelpers {
    static getCreationDate(pdfDoc: PDFDocument): Date | undefined {
        try {
            return pdfDoc.getCreationDate();
        } catch (e) {
            LoggerService.error(`Kunne ikke hente creation date for dokument`, e);
            return new Date();
        }
    }

    static getModificationDate(pdfDoc: PDFDocument): Date | undefined {
        try {
            return pdfDoc.getModificationDate();
        } catch (e) {
            LoggerService.error(`Kunne ikke hente modification date for dokument`, e);
            return new Date();
        }
    }

    static getCreator(pdfDoc: PDFDocument): string | undefined {
        try {
            return pdfDoc.getCreator();
        } catch (e) {
            LoggerService.error(`Kunne ikke hente creator for dokument`, e);
            return PDF_EDITOR_CREATOR;
        }
    }

    static getProducer(pdfDoc: PDFDocument): string | undefined {
        try {
            return pdfDoc.getProducer();
        } catch (e) {
            LoggerService.error(`Kunne ikke hente producer for dokument`, e);
            return PDF_EDITOR_PRODUCER;
        }
    }

    static getAuthor(pdfDoc: PDFDocument): string | undefined {
        try {
            return pdfDoc.getAuthor();
        } catch (e) {
            LoggerService.error(`Kunne ikke hente author for dokument`, e);
            return;
        }
    }

    static getSubject(pdfDoc: PDFDocument): string | undefined {
        try {
            return pdfDoc.getSubject();
        } catch (e) {
            LoggerService.error(`Kunne ikke hente subject for dokument`, e);
            return;
        }
    }

    static getTitle(pdfDoc: PDFDocument): string | undefined {
        try {
            return pdfDoc.getTitle();
        } catch (e) {
            LoggerService.error(`Kunne ikke hente title for dokument`, e);
            return;
        }
    }
}
/**
 * Repairs page leaves whose Parent reference does not point to a valid PDFPageTree node.
 * Such corruption causes "Parent.ascend is not a function" errors in every pdf-lib
 * operation that traverses inheritable attributes (getRotation, getWidth, Resources, …).
 * Broken leaves are re-parented to the document root page tree so the chain is valid.
 */
export function repairBrokenParentChain(pdfDoc: PDFDocument): void {
    try {
        const catalogPages = pdfDoc.catalog.get(PDFName.of("Pages"));
        if (!(catalogPages instanceof PDFRef)) return;
        const pagesRoot = pdfDoc.context.lookup(catalogPages);
        // A valid PDFPageTree has an "ascend" method; PDFPageLeaf (or other types) does not.
        const pagesRootObj = pagesRoot as unknown as { ascend?: unknown };
        if (typeof pagesRootObj.ascend !== "function") return;

        let repairedCount = 0;
        for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
            if (!(obj instanceof PDFPageLeaf)) continue;

            const parentRef = obj.get(PDFName.of("Parent"));
            const resolvedParent =
                parentRef instanceof PDFRef ? pdfDoc.context.lookupMaybe(parentRef, PDFDict) : undefined;
            const isValid = typeof (resolvedParent as unknown as { ascend?: unknown })?.ascend === "function";

            if (!isValid) {
                preserveInheritedPageAttributes(obj, pdfDoc);
                obj.set(PDFName.of("Parent"), catalogPages);
                repairedCount++;
            }
        }

        if (repairedCount > 0) {
            LoggerService.warn(
                `repairBrokenParentChain: Fixed ${repairedCount} page leaf(s) with broken Parent reference`,
            );
        }
    } catch (e) {
        LoggerService.error("repairBrokenParentChain: Unexpected error during repair", e);
    }
}

const PAGE_INHERITABLE_ATTRIBUTES = ["Resources", "MediaBox", "CropBox", "Rotate"] as const;

function preserveInheritedPageAttributes(pageLeaf: PDFPageLeaf, pdfDoc: PDFDocument): void {
    for (const attributeName of PAGE_INHERITABLE_ATTRIBUTES) {
        const attribute = PDFName.of(attributeName);
        if (pageLeaf.get(attribute)) continue;

        const inheritedValue = findAttributeInParentChain(pageLeaf, attribute, pdfDoc);
        if (inheritedValue) {
            pageLeaf.set(attribute, inheritedValue);
        }
    }
}

function findAttributeInParentChain(
    pageLeaf: PDFPageLeaf,
    attribute: PDFName,
    pdfDoc: PDFDocument,
): PDFObject | undefined {
    let parent = pageLeaf.get(PDFName.of("Parent"));
    const visitedParentRefs = new Set<string>();

    while (parent instanceof PDFRef && !visitedParentRefs.has(parent.toString())) {
        visitedParentRefs.add(parent.toString());
        try {
            const parentObject = pdfDoc.context.lookup(parent);
            if (!(parentObject instanceof PDFDict)) return;

            const inheritedValue = parentObject.get(attribute);
            if (inheritedValue) return inheritedValue;

            parent = parentObject.get(PDFName.of("Parent"));
        } catch {
            return;
        }
    }
}

export function hasInvalidXObject(pdfdoc: PDFDocument) {
    try {
        return pdfdoc.getPages().some((page, index) => {
            // page.node.context.enumerateIndirectObjects().forEach((indirectObject) => {
            //     const ref = indirectObject[0];
            //     const obj = indirectObject[1];
            //     // console.log(ref.toString(), obj.toString());
            //     if (obj instanceof PDFRawStream) {
            //         console.log(obj.getContentsString());
            //     }
            // });
            return pageHasInvalidXObject(page, pdfdoc, index + 1);
        });
    } catch (e) {
        LoggerService.error("Det skjdde en feil ved sjekk for ugyldig xObject", e);
        return false;
    }
}

export function deleteGroupobjectWithSKey(pdfdoc: PDFDocument) {
    pdfdoc.getPages().some((page, index) => {
        const group = page.node.get(PDFName.of("Group"));
        if (group != null && group instanceof PDFDict) {
            const sObject = group.get(PDFName.of("S"));
            if (sObject != null) {
                LoggerService.info(`Delete Group S object from PDF for page ${index + 1} ${group.toString()}`);
                page.node.delete(PDFName.of("Group"));
            }
        }
    });
}

function pageHasInvalidXObject(page: PDFPage, pdfdoc: PDFDocument, pageNumber: number) {
    // Use page.node.get() instead of page.node.Resources() to avoid
    // traversing the parent chain (which throws on corrupted PDFs)
    const resourcesObj = page.node.get(PDFName.of("Resources"));
    const resources =
        resourcesObj instanceof PDFDict ? resourcesObj : pdfdoc.context.lookupMaybe(resourcesObj, PDFDict);
    const xObject = resources?.get(PDFName.of("XObject"));
    if (xObject && xObject instanceof PDFDict) {
        const xMap = xObject.asMap();
        return Array.from(xMap.keys()).some((key) => {
            const xObjectRef = xMap.get(key);
            const stream = xObjectRef instanceof PDFRef ? pdfdoc.context.lookup(xObjectRef) : xObjectRef;
            if (!(stream instanceof PDFStream)) {
                LoggerService.warn(`Side ${pageNumber} har ugyldig XObject fra PDF ${key}`);
                return true;
            }
            const type = stream.dict.get(PDFName.of("Type"));
            if (type == undefined && key.toString().includes("FlatWidget")) {
                LoggerService.warn(`Side ${pageNumber} har ugyldig XObject fra PDF ${key}`);
                return true;
            }
        });
    }
    return false;
}

export async function flattenForm(pdfDoc: PDFDocument, onError: () => void, ignoreError: boolean) {
    if (hasInvalidXObject(pdfDoc)) {
        LoggerService.warn("Dokument har ugyldig XObject før flatning av formfelter. Ruller tilbake endringer");
        await onError();
        return;
    }

    try {
        const form = pdfDoc.getForm();
        form.flatten();
        if (hasInvalidXObject(pdfDoc)) {
            LoggerService.warn(`Dokument er korrupt etter flatning av form felter. Ruller tilbake endringer`);
            await onError();
        }
    } catch (e) {
        if (ignoreError) {
            LoggerService.error(
                "Det skjedde en feil ved 'flatning' av form felter i PDF. Gjør om feltene read-only fordi det er noen sider som er maskert",
                e,
            );
            flattenFormV2(pdfDoc);
            makeFieldsReadOnly(pdfDoc);
        } else {
            try {
                flattenFormV2(pdfDoc);
            } catch {
                LoggerService.error(
                    "Det skjedde en feil ved 'flatning' av form felter i PDF. Laster PDF på nytt uten å flatne form for å unngå korrupt PDF",
                    e,
                );
                await onError();
            }
        }
    }
}

export async function repairPDF(pdfDoc: PDFDocument) {
    try {
        await removeUnlinkedAnnots(pdfDoc);
    } catch (e) {
        LoggerService.error("Det skjedde en feil ved reparasjon av PDF", e);
    }
}

export async function debugRepairPDF(pdfDoc: PDFDocument) {
    try {
        pdfDoc.getPages().forEach((page, index) => {
            try {
                const resources = page.node.get(PDFName.of("Resources"));
                console.log("Page number", index, page.node.toString(), resources);
                pageHasInvalidXObject(page, pdfDoc, index + 1);
            } catch (e) {
                console.log("Page number", index, "error accessing page properties", e);
            }
            const group = page.node.get(PDFName.of("Group"));
            if (group != null && group instanceof PDFDict) {
                const sObject = group.get(PDFName.of("S"));
                console.log("Group S object", group.toString(), sObject, sObject.toString());
            }
        });

        //console.log(pdfdoc.getForm().acroForm.getAllFields());
        pdfDoc
            .getForm()
            .acroForm.getAllFields()
            .forEach((field) => console.log(field[1].toString(), field));
    } catch (e) {
        LoggerService.warn("Det skjedde en feil i debugRepairPDF funksjonen", e);
    }
}

export async function lastGyldigPDF(pdfBytearray: PdfDocumentType) {
    try {
        const pdfDoc = await PDFDocument.load(pdfBytearray);
        // Sjekk om sidene kan lastes. Hvis ikke så betyr det at PDF er korrupt
        pdfDoc.getPages();
        return pdfDoc;
    } catch (e) {
        LoggerService.warn("Kunne ikke hente sider for PDF pga corrupt PDF fil. Fortsetter uten PDFBox-reparasjon", e);
        return await PDFDocument.load(pdfBytearray);
    }
}

export interface IPrintableWarning {
    message: string;
    affectedPages?: number[];
}

export async function getPrintableWarning(pdfBytearray: PdfDocumentType): Promise<IPrintableWarning | undefined> {
    const pdfBytes = toPdfBytes(pdfBytearray);
    const hasEncryptionMarker = hasEncryptionDictionaryMarker(pdfBytes);

    try {
        const pdfDoc = await PDFDocument.load(pdfBytearray);
        const pages = pdfDoc.getPages();
        const pageLeafCount = pdfDoc.context
            .enumerateIndirectObjects()
            .filter(([_, obj]) => obj instanceof PDFPageLeaf).length;
        const invalidXObjectPages = getInvalidXObjectPages(pdfDoc);
        const invalidNamePages = getPagesWithInvalidNameLikeEntries(pdfDoc);

        const warnings: string[] = [];
        const affectedPages = new Set<number>();
        if (hasEncryptionMarker) {
            warnings.push(
                "Dokumentet ser ut til å være kryptert eller ha utskriftsbegrensninger og kan feile ved natív utskrift i enkelte PDF-visere.",
            );
        }
        if (pageLeafCount > pages.length) {
            warnings.push("Dokumentet har en korrupt sidestruktur og kan feile ved utskrift i enkelte PDF-visere.");
            for (let pageNumber = pages.length + 1; pageNumber <= pageLeafCount; pageNumber++) {
                affectedPages.add(pageNumber);
            }
        }
        if (invalidXObjectPages.length > 0) {
            warnings.push("Dokumentet inneholder ugyldige skjema- eller XObject-ressurser som kan hindre utskrift.");
            invalidXObjectPages.forEach((pageNumber) => affectedPages.add(pageNumber));
        }
        if (invalidNamePages.length > 0) {
            warnings.push("Dokumentet inneholder ugyldige PDF-objekter der en navneverdi er forventet.");
            invalidNamePages.forEach((pageNumber) => affectedPages.add(pageNumber));
        }

        if (warnings.length === 0) {
            return undefined;
        }

        return {
            message: `${warnings[0]} Dokumentet kan fortsatt fungere i forhåndsvisning, men feile ved sentral utskrift.`,
            affectedPages: affectedPages.size > 0 ? Array.from(affectedPages).sort((a, b) => a - b) : undefined,
        };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (hasEncryptionMarker || /decrypt|password|encrypted/i.test(errorMessage)) {
            return {
                message:
                    "Dokumentet ser ut til å være kryptert eller passordbeskyttet. Det kan fungere i noen visere, men feile ved sentral utskrift eller videre behandling.",
            };
        }
        return {
            message: "Dokumentet ser korrupt ut og kan feile ved sentral utskrift eller åpning i enkelte PDF-visere.",
        };
    }
}

function toPdfBytes(pdfBytearray: PdfDocumentType): Uint8Array {
    if (typeof pdfBytearray === "string") {
        return new TextEncoder().encode(pdfBytearray);
    }

    return pdfBytearray instanceof Uint8Array ? pdfBytearray : new Uint8Array(pdfBytearray);
}

function hasEncryptionDictionaryMarker(pdfBytes: Uint8Array): boolean {
    const marker = "/Encrypt";
    const markerBytes = new TextEncoder().encode(marker);

    for (let byteIndex = 0; byteIndex <= pdfBytes.length - markerBytes.length; byteIndex++) {
        let matches = true;
        for (let markerIndex = 0; markerIndex < markerBytes.length; markerIndex++) {
            if (pdfBytes[byteIndex + markerIndex] !== markerBytes[markerIndex]) {
                matches = false;
                break;
            }
        }

        if (matches) {
            return true;
        }
    }

    return false;
}

function getPagesWithInvalidNameLikeEntries(pdfDoc: PDFDocument): number[] {
    const invalidPageNumbers = new Set<number>();
    const pages = pdfDoc.getPages();

    pages.forEach((page, index) => {
        if (hasInvalidNameLikeEntriesInObject(pdfDoc, page.node)) {
            invalidPageNumbers.add(index + 1);
        }

        try {
            const resources = page.node.get(PDFName.of("Resources"));
            const resourcesDict = resources instanceof PDFDict ? resources : pdfDoc.context.lookup(resources, PDFDict);
            if (resourcesDict && hasInvalidNameLikeEntriesInObject(pdfDoc, resourcesDict)) {
                invalidPageNumbers.add(index + 1);
            }
        } catch {
            // Ignore lookup failures here; the page warning is best-effort only.
        }
    });

    return Array.from(invalidPageNumbers).sort((a, b) => a - b);
}

function hasInvalidNameLikeEntriesInObject(pdfDoc: PDFDocument, obj: PDFDict): boolean {
    return [obj].some((dict) => {
        if (!(obj instanceof PDFDict)) {
            return false;
        }

        const type = dict.get(PDFName.of("Type"));
        if (type && !isNameValue(pdfDoc, type)) {
            return true;
        }

        const subtype = dict.get(PDFName.of("Subtype"));
        if (subtype && !isNameValue(pdfDoc, subtype)) {
            return true;
        }

        const sValue = dict.get(PDFName.of("S"));
        if (sValue && !isNameValue(pdfDoc, sValue)) {
            return true;
        }

        const filter = dict.get(PDFName.of("Filter"));
        if (filter && !isNameValue(pdfDoc, filter) && !isArrayOfNames(pdfDoc, filter)) {
            return true;
        }

        const procSet = dict.get(PDFName.of("ProcSet"));
        if (procSet && !isArrayOfNames(pdfDoc, procSet)) {
            return true;
        }

        return false;
    });
}

function getInvalidXObjectPages(pdfDoc: PDFDocument): number[] {
    return pdfDoc
        .getPages()
        .map((page, index) => (pageHasInvalidXObject(page, pdfDoc, index + 1) ? index + 1 : undefined))
        .filter((pageNumber): pageNumber is number => typeof pageNumber === "number");
}

function isNameValue(pdfDoc: PDFDocument, value: PDFObject): boolean {
    const resolvedValue = value instanceof PDFRef ? pdfDoc.context.lookupMaybe(value, PDFName) : value;
    return resolvedValue instanceof PDFName;
}

function isArrayOfNames(pdfDoc: PDFDocument, value: PDFObject): boolean {
    const resolvedValue = value instanceof PDFRef ? pdfDoc.context.lookupMaybe(value, PDFArray) : value;
    if (!(resolvedValue instanceof PDFArray)) {
        return false;
    }

    return resolvedValue.asArray().every((entry) => {
        const resolvedEntry = entry instanceof PDFRef ? pdfDoc.context.lookupMaybe(entry, PDFName) : entry;
        return resolvedEntry instanceof PDFName;
    });
}

export async function fixMissingPages(
    pdfDoc: PDFDocument,
    ignoredPageRefs: Set<string> | string[] = [],
    maxPageCountAfterRecovery?: number,
) {
    // Corrupt PDFs can contain valid /Page leaf objects that are no longer reachable from the
    // page tree. We scan indirect objects for those leaves and stitch back only the ones that
    // look renderable and are not explicitly ignored by the caller.
    const pageLeafRefs = pdfDoc.context
        .enumerateIndirectObjects()
        .filter(([_, obj]) => obj instanceof PDFPageLeaf)
        .map(([ref]) => ref);

    LoggerService.info(
        `fixMissingPages start totalPageLeafs=${pageLeafRefs.length} ignoredRefs=${Array.from(ignoredPageRefs).join(
            "|",
        )} maxPageCountAfterRecovery=${maxPageCountAfterRecovery ?? "none"}`,
    );

    if (pageLeafRefs.length === 0) {
        return;
    }

    let pagesFromTree: PDFPage[] = [];
    try {
        pagesFromTree = pdfDoc.getPages();
    } catch (e) {
        LoggerService.warn("Kunne ikke hente sider fra page tree. Forsøker å rekonstruere manglende sider", e);
    }

    const existingPageRefSet = new Set(pagesFromTree.map((page) => page.ref.toString()));
    const ignoredRefSet = new Set(ignoredPageRefs);
    const missingPageRefs = pageLeafRefs.filter((ref) => {
        const refString = ref.toString();
        // Ignored refs represent pages the editor intentionally removed or replaced.
        return !existingPageRefSet.has(refString) && !ignoredRefSet.has(refString);
    });

    if (missingPageRefs.length === 0) {
        LoggerService.info(`fixMissingPages nothing to recover currentPageCount=${pagesFromTree.length}`);
        return;
    }

    LoggerService.warn(
        `Fant ${missingPageRefs.length} manglende sider i page tree av totalt ${pageLeafRefs.length} page leafs`,
    );

    const getRefNumber = (ref: PDFRef) => Number(ref.toString().split(" ")[0]);
    const sortedAllLeafRefs = [...pageLeafRefs]
        .sort((a, b) => getRefNumber(a) - getRefNumber(b))
        .map((ref) => ref.toString());
    const currentOrder = pagesFromTree.map((page) => page.ref.toString());

    let recoveredCount = 0;
    let skippedNotPageLeaf = 0;
    let skippedNotRecoverable = 0;
    let brokenByMaxCap = 0;

    const missingRefsOrdered = [...missingPageRefs].sort((a, b) => getRefNumber(a) - getRefNumber(b));
    for (const missingRef of missingRefsOrdered) {
        if (maxPageCountAfterRecovery && currentOrder.length >= maxPageCountAfterRecovery) {
            brokenByMaxCap = missingRefsOrdered.length - recoveredCount - skippedNotPageLeaf - skippedNotRecoverable;
            break;
        }
        try {
            const missingLeafDict = pdfDoc.context.lookupMaybe(missingRef, PDFDict);
            if (!isPageLeafDict(missingLeafDict)) {
                skippedNotPageLeaf += 1;
                continue;
            }
            // We only recover leaves that appear visually meaningful. This avoids rebuilding
            // clearly blank/internal objects while still recovering pages with atypical content.
            const isRecoverablePage = hasRecoverablePageContent(missingLeafDict, pdfDoc);
            if (!isRecoverablePage) {
                skippedNotRecoverable += 1;
                continue;
            }

            const missingRefString = missingRef.toString();
            const desiredIndex = sortedAllLeafRefs.indexOf(missingRefString);
            const insertIndex = Math.max(
                0,
                // Reinsert according to the natural leaf/ref order so the repaired render order
                // matches the original document structure as closely as possible.
                currentOrder.filter((ref) => sortedAllLeafRefs.indexOf(ref) < desiredIndex).length,
            );

            pdfDoc.catalog.insertLeafNode(missingRef, insertIndex);
            currentOrder.splice(insertIndex, 0, missingRefString);
            recoveredCount += 1;
        } catch (e) {
            LoggerService.warn(`Kunne ikke gjenopprette side-ref ${missingRef.toString()}`, e);
        }
    }

    LoggerService.info(
        `fixMissingPages done recoveredCount=${recoveredCount} skippedNotPageLeaf=${skippedNotPageLeaf} skippedNotRecoverable=${skippedNotRecoverable} brokenByMaxCap=${brokenByMaxCap} finalPageCount=${currentOrder.length}`,
    );
}

function isPageLeafDict(pageLeafDict?: PDFDict): boolean {
    if (!pageLeafDict) {
        return false;
    }

    const type = pageLeafDict.get(PDFName.of("Type"));
    return type?.toString() === "/Page";
}

function hasPageLeafContents(pageLeafDict: PDFDict | undefined, pdfDoc: PDFDocument): boolean {
    if (!pageLeafDict) {
        return false;
    }

    const contents = pageLeafDict.get(PDFName.of("Contents"));
    if (!contents) {
        return false;
    }

    return hasRenderableContents(contents, pdfDoc);
}

function hasRecoverablePageContent(pageLeafDict: PDFDict | undefined, pdfDoc: PDFDocument): boolean {
    if (!pageLeafDict) {
        return false;
    }

    // Prefer real page contents when present, but corrupt PDFs may instead expose their visual
    // data through annotations or resource dictionaries without a normal Contents stream.
    if (hasPageLeafContents(pageLeafDict, pdfDoc)) {
        return true;
    }

    const annots = pageLeafDict.get(PDFName.of("Annots"));
    if (annots instanceof PDFArray && annots.size() > 0) {
        return true;
    }

    const resources = pageLeafDict.get(PDFName.of("Resources"));
    if (!resources) {
        return false;
    }

    try {
        const resourcesDict = resources instanceof PDFDict ? resources : pdfDoc.context.lookup(resources, PDFDict);
        const xObject = resourcesDict.get(PDFName.of("XObject"));
        if (xObject instanceof PDFDict && xObject.keys().length > 0) {
            return true;
        }

        const procSet = resourcesDict.get(PDFName.of("ProcSet"));
        if (procSet instanceof PDFArray && procSet.size() > 0) {
            return true;
        }
    } catch {
        return false;
    }

    return false;
}

function hasRenderableContents(contents: PDFObject, pdfDoc: PDFDocument): boolean {
    if (contents instanceof PDFArray) {
        return contents.asArray().some((entry) => hasRenderableContents(entry, pdfDoc));
    }

    if (contents instanceof PDFRef) {
        try {
            const resolvedContents = pdfDoc.context.lookup(contents, PDFStream);
            return hasRenderableContents(resolvedContents, pdfDoc);
        } catch {
            return false;
        }
    }

    if (contents instanceof PDFRawStream) {
        return contents.getContentsString().trim().length > 0;
    }

    if (contents instanceof PDFStream) {
        return contents.getContentsString().trim().length > 0;
    }

    return false;
}

async function removeUnlinkedAnnots(pdfdoc: PDFDocument) {
    for (const page of pdfdoc.getPages()) {
        try {
            const annots = page.node.get(PDFName.of("Annots")) as PDFArray;
            if (annots == undefined) continue;
            for (const annot of annots.asArray()) {
                try {
                    const annotDict = pdfdoc.context.lookupMaybe(annot, PDFDict);
                    if (annotDict == undefined) {
                        LoggerService.warn("Fjerner annotasjon som ikke har noe kilde fra side: " + annot.toString());
                        // page.node.removeAnnot(annotRef);
                        page.node.delete(PDFName.of("Annots"));
                    }
                } catch (e) {
                    LoggerService.warn("Kunne ikke fjerne annotasjon", e);
                }
            }
        } catch (e) {
            LoggerService.warn("Det skjedde en feil ved fjerning ulinket annoteringer", e);
        }
    }
}

export function flattenFormV2(pdfDoc: PDFDocument) {
    const form = pdfDoc.getForm();
    const formFields = form.getFields();

    for (const field of formFields) {
        try {
            while (field.acroField.getWidgets().length) {
                try {
                    field.acroField.removeWidget(0);
                } catch (e) {
                    console.warn("Kunne ikke fjerne widget", e);
                }
            }
            form.removeField(field);
        } catch (e) {
            // Ignorer feil
            console.warn("Kunne ikke fjerne alle felter", e);
        }
    }
    try {
        form.flatten();
    } catch (e) {
        if (e.message.includes("Tried to remove inexistent field")) {
            LoggerService.error("Ignorer feil ved fjerning av form felter som ikke eksisterer i PDF.", e);
            return;
        }
        throw e;
    }
}

export function makeFieldsReadOnly(pdfDoc: PDFDocument) {
    const form = pdfDoc.getForm();
    try {
        form.getFields().forEach((field) => {
            form.removeField(field);
        });
        form.flatten();
    } catch (e) {
        LoggerService.error("Det skjedde en feil ved markering av form felter som read-only PDF", e);
    }
}
//
