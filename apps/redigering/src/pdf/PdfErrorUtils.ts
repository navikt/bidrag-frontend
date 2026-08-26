/**
 * Shared helpers for interpreting errors thrown by pdf-lib operations on corrupt PDFs.
 */

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Detects the specific error signature pdf-lib throws when a page's /Parent reference does
 * not resolve to a valid PDFPageTree/PDFPageLeaf node (i.e. "Parent.ascend is not a
 * function"). This is thrown from many different call sites (copyPages, getRotation,
 * getWidth, …) with slightly different wrapping, so all of them are recognized by matching on
 * "ascend"/"Parent" in the message rather than a specific error type.
 */
export function isPageTreeCorruptionError(error: unknown): boolean {
    const message = getErrorMessage(error);
    return message.includes("ascend") || message.includes("Parent");
}
