import { decodePDFRawStream, PDFDocument, PDFName, PDFPageLeaf, PDFRawStream, StandardFonts } from "@cantoo/pdf-lib";

/**
 * Converts text to the uppercase hex form pdf-lib writes for drawText() operands, so tests can
 * find drawn text inside decoded content streams.
 */
export function textToHex(text: string): string {
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

/**
 * Decodes every stream object in the document and concatenates the result in uppercase. Used to
 * prove that text is truly present in, or absent from, a document regardless of which page or
 * orphaned object holds it.
 */
export function collectAllDecodedStreamText(doc: PDFDocument): string {
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

/**
 * Counts every page leaf object in the document, including leaves that are not part of the page
 * tree and therefore invisible to getPageCount().
 */
export function countPageLeafObjects(doc: PDFDocument): number {
    return doc.context.enumerateIndirectObjects().filter(([, obj]) => obj instanceof PDFPageLeaf).length;
}

export const SHARED_RESOURCE_FORM_TEXTS = ["SHARED_FORM_A_TEXT", "SHARED_FORM_B_TEXT", "SHARED_FORM_C_TEXT"];
export const SHARED_RESOURCE_JPEG_MARKERS = ["SHARED_JPEG_A_MARKER", "SHARED_JPEG_B_MARKER", "SHARED_JPEG_C_MARKER"];
export const SHARED_RESOURCE_XOBJECT_NAMES = ["XA", "XB", "XC"];
export type SharedResourceXObjectKind = "form" | "jpeg";

/**
 * Converts bytes to a string with one character per byte, so tests can search raw saved PDF bytes
 * for markers in streams pdf-lib cannot decode, such as JPEG data.
 */
export function latin1(bytes: Uint8Array): string {
    return decodeStreamBytesToString(bytes);
}

/**
 * Builds a three-page PDF whose pages inherit one /Resources dictionary from the page tree. That
 * dictionary lists XObjects XA, XB and XC and page n only draws XObject n. Copying or keeping any
 * page therefore drags every XObject along unless resources are pruned. "form" XObjects draw the
 * texts in SHARED_RESOURCE_FORM_TEXTS; "jpeg" XObjects are DCT images whose raw bytes carry the
 * markers in SHARED_RESOURCE_JPEG_MARKERS, like the scans in real documents.
 */
export async function buildSharedResourcesPdf(kind: SharedResourceXObjectKind = "form"): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const xObjectRefs = SHARED_RESOURCE_XOBJECT_NAMES.map((_, index) =>
        doc.context.register(
            kind === "form"
                ? doc.context.stream(`BT /F1 24 Tf 50 700 Td <${textToHex(SHARED_RESOURCE_FORM_TEXTS[index])}> Tj ET`, {
                      Type: "XObject",
                      Subtype: "Form",
                      BBox: [0, 0, 595, 842],
                      Resources: { Font: { F1: font.ref } },
                  })
                : doc.context.stream(`\u00ff\u00d8${SHARED_RESOURCE_JPEG_MARKERS[index]}\u00ff\u00d9`, {
                      Type: "XObject",
                      Subtype: "Image",
                      Width: 1,
                      Height: 1,
                      ColorSpace: "DeviceGray",
                      BitsPerComponent: 8,
                      Filter: "DCTDecode",
                  }),
        ),
    );
    const xObjects = Object.fromEntries(SHARED_RESOURCE_XOBJECT_NAMES.map((name, index) => [name, xObjectRefs[index]]));
    doc.catalog.Pages().set(PDFName.of("Resources"), doc.context.obj({ XObject: xObjects }));

    SHARED_RESOURCE_XOBJECT_NAMES.forEach((name) => {
        const page = doc.addPage([595, 842]);
        page.node.delete(PDFName.of("Resources"));
        page.node.set(
            PDFName.of("Contents"),
            doc.context.register(doc.context.stream(`q 595 0 0 842 0 0 cm /${name} Do Q`)),
        );
    });
    return doc.save();
}
