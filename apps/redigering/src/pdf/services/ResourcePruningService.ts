import { LoggerService } from "@bidrag/common";
import {
    decodePDFRawStream,
    PDFArray,
    type PDFContext,
    PDFDict,
    PDFName,
    PDFNumber,
    type PDFObject,
    type PDFPageLeaf,
    PDFPageTree,
    PDFRawStream,
    PDFStream,
} from "@cantoo/pdf-lib";

/**
 * Pages often share one /Resources dictionary, either inherited from the page tree or as a shared
 * object, and copyPages() gives every copied page the full inherited dictionary. A form XObject,
 * image or font drawn only on a removed or masked page therefore stays reachable through the
 * resources of the pages that are kept. Every kept page gets its own /Resources holding only the
 * entries its content can actually use, so the rest becomes unreachable and can be deleted.
 */

const RESOURCES = PDFName.of("Resources");
const CONTENTS = PDFName.of("Contents");
const ANNOTS = PDFName.of("Annots");
const AP = PDFName.of("AP");
const PARENT = PDFName.of("Parent");
const XOBJECT = PDFName.of("XObject");
const PATTERN = PDFName.of("Pattern");
const COLOR_SPACE = PDFName.of("ColorSpace");
const FONT = PDFName.of("Font");
const EXT_G_STATE = PDFName.of("ExtGState");
const SUBTYPE = PDFName.of("Subtype");
const FORM = PDFName.of("Form");
const TYPE3 = PDFName.of("Type3");
const CHAR_PROCS = PDFName.of("CharProcs");
const PATTERN_TYPE = PDFName.of("PatternType");
const TILING_PATTERN_TYPE = 1;
const SOFT_MASK = PDFName.of("SMask");
const SOFT_MASK_GROUP = PDFName.of("G");
const PRUNABLE_RESOURCE_CATEGORIES = new Set([XOBJECT, FONT, EXT_G_STATE, PATTERN, PDFName.of("Shading"), COLOR_SPACE]);
// Default colour spaces replace device colour spaces implicitly and are never named in content.
const IMPLICIT_COLOR_SPACE_PREFIX = "Default";

const CHAR_PERCENT = 0x25;
const CHAR_OPEN_PAREN = 0x28;
const CHAR_CLOSE_PAREN = 0x29;
const CHAR_LESS_THAN = 0x3c;
const CHAR_GREATER_THAN = 0x3e;
const CHAR_SLASH = 0x2f;
const CHAR_BACKSLASH = 0x5c;
const CHAR_E = 0x45;
const CHAR_I = 0x49;
const CHAR_LINE_FEED = 0x0a;
const CHAR_CARRIAGE_RETURN = 0x0d;
const WHITESPACE = new Set([0x00, 0x09, CHAR_LINE_FEED, 0x0c, CHAR_CARRIAGE_RETURN, 0x20]);
const DELIMITERS = new Set([
    CHAR_OPEN_PAREN,
    CHAR_CLOSE_PAREN,
    CHAR_LESS_THAN,
    CHAR_GREATER_THAN,
    0x5b,
    0x5d,
    0x7b,
    0x7d,
    CHAR_SLASH,
    CHAR_PERCENT,
]);
const INLINE_IMAGE_DATA_OPERATOR = "ID";

/**
 * Returns every name token in a content stream, skipping strings, comments and inline image data.
 * Every name is collected regardless of operator, so a resource referenced by any operator is
 * counted as used. Returns undefined when the stream cannot be tokenised reliably, so callers can
 * keep the resources untouched instead of dropping something that is in use.
 */
export function collectContentNames(content: Uint8Array): Set<PDFName> | undefined {
    const names = new Set<PDFName>();
    let index = 0;
    while (index < content.length) {
        const byte = content[index];
        if (WHITESPACE.has(byte)) {
            index += 1;
        } else if (byte === CHAR_PERCENT) {
            index = skipComment(content, index);
        } else if (byte === CHAR_OPEN_PAREN) {
            const end = skipLiteralString(content, index);
            if (end === undefined) return undefined;
            index = end;
        } else if (byte === CHAR_LESS_THAN) {
            if (content[index + 1] === CHAR_LESS_THAN) {
                index += 2;
            } else {
                const end = content.indexOf(CHAR_GREATER_THAN, index);
                if (end < 0) return undefined;
                index = end + 1;
            }
        } else if (byte === CHAR_SLASH) {
            const end = readRegularToken(content, index + 1);
            names.add(PDFName.of(toLatin1(content, index + 1, end)));
            index = end;
        } else if (DELIMITERS.has(byte)) {
            index += 1;
        } else {
            const end = readRegularToken(content, index);
            if (toLatin1(content, index, end) === INLINE_IMAGE_DATA_OPERATOR) {
                const afterImage = skipInlineImageData(content, end);
                if (afterImage === undefined) return undefined;
                index = afterImage;
            } else {
                index = end;
            }
        }
    }
    return names;
}

/**
 * Gives every page in livePageLeaves its own /Resources containing only the entries its content,
 * the form XObjects and tiling patterns it draws, and its annotation appearances can use, then
 * removes /Resources from the page tree nodes so nothing inherits the unpruned dictionary.
 * Returns the number of resource entries dropped.
 */
export function pruneUnusedPageResources(context: PDFContext, livePageLeaves: PDFPageLeaf[]): number {
    const prunedOwnResources = new Set<PDFStream>();
    let removedEntryCount = 0;
    const countRemoved = () => {
        removedEntryCount += 1;
    };

    for (const leaf of livePageLeaves) {
        const resources = findInheritedResources(context, leaf);
        if (!resources) continue;

        const scopeStreams = [...getStreams(context, leaf.get(CONTENTS)), ...getAppearanceStreams(context, leaf)];
        const usedNames = collectScopeNames(context, scopeStreams, resources, prunedOwnResources, countRemoved);
        if (usedNames === undefined) {
            LoggerService.warn("pruneUnusedPageResources: Kunne ikke lese sideinnhold. Beholder sidens ressurser.");
            leaf.set(RESOURCES, resources);
        } else {
            leaf.set(RESOURCES, buildPrunedResources(context, resources, usedNames, countRemoved));
        }
    }

    for (const leaf of livePageLeaves) {
        stripAncestorResources(context, leaf);
    }
    return removedEntryCount;
}

function collectScopeNames(
    context: PDFContext,
    streams: PDFStream[],
    resources: PDFDict,
    prunedOwnResources: Set<PDFStream>,
    countRemoved: () => void,
): Set<PDFName> | undefined {
    const usedNames = new Set<PDFName>();
    const scanned = new Set<PDFStream>();
    const pending = [...streams];

    while (pending.length > 0) {
        const stream = pending.pop() as PDFStream;
        if (scanned.has(stream)) continue;
        scanned.add(stream);

        const content = decodeStream(stream);
        const names = content ? collectContentNames(content) : undefined;
        if (!names) return undefined;

        for (const name of names) {
            usedNames.add(name);
            for (const nested of resolveNestedContentStreams(context, resources, name)) {
                const ownResources = context.lookup(nested.dict.get(RESOURCES));
                if (ownResources instanceof PDFDict) {
                    pruneOwnResources(context, nested, ownResources, prunedOwnResources, countRemoved);
                } else {
                    // Without own /Resources, the nested content resolves names against this scope.
                    pending.push(nested);
                }
            }
        }
    }
    return usedNames;
}

// A form XObject, tiling pattern or soft mask group with its own /Resources only uses names from
// its own content, so pruning it in place is correct for every page that draws it.
function pruneOwnResources(
    context: PDFContext,
    stream: PDFStream,
    ownResources: PDFDict,
    prunedOwnResources: Set<PDFStream>,
    countRemoved: () => void,
): void {
    if (prunedOwnResources.has(stream)) return;
    prunedOwnResources.add(stream);
    const usedNames = collectScopeNames(context, [stream], ownResources, prunedOwnResources, countRemoved);
    if (usedNames !== undefined) {
        stream.dict.set(RESOURCES, buildPrunedResources(context, ownResources, usedNames, countRemoved));
    }
}

// Only streams that are content themselves are scanned: images are binary data and never name
// resources, so decoding them would only fail (JPEG) or waste time and risk false anomalies.
function resolveNestedContentStreams(context: PDFContext, resources: PDFDict, name: PDFName): PDFStream[] {
    const lookupResource = (category: PDFName) => {
        const categoryDict = context.lookup(resources.get(category));
        return categoryDict instanceof PDFDict ? context.lookup(categoryDict.get(name)) : undefined;
    };
    const nested: PDFStream[] = [];

    const xObject = lookupResource(XOBJECT);
    if (xObject instanceof PDFStream && xObject.dict.get(SUBTYPE) === FORM) {
        nested.push(xObject);
    }

    const pattern = lookupResource(PATTERN);
    if (pattern instanceof PDFStream && isNumber(context.lookup(pattern.dict.get(PATTERN_TYPE)), TILING_PATTERN_TYPE)) {
        nested.push(pattern);
    }

    // Type3 glyph procedures without font-level /Resources resolve names against the page.
    // With their own /Resources the font is kept whole, so nothing needs to be scanned.
    const font = lookupResource(FONT);
    if (
        font instanceof PDFDict &&
        font.get(SUBTYPE) === TYPE3 &&
        !(context.lookup(font.get(RESOURCES)) instanceof PDFDict)
    ) {
        const charProcs = context.lookup(font.get(CHAR_PROCS));
        if (charProcs instanceof PDFDict) {
            nested.push(...charProcs.entries().flatMap(([, charProc]) => getStreams(context, charProc)));
        }
    }

    const extGState = lookupResource(EXT_G_STATE);
    const softMask = extGState instanceof PDFDict ? context.lookup(extGState.get(SOFT_MASK)) : undefined;
    const softMaskGroup = softMask instanceof PDFDict ? context.lookup(softMask.get(SOFT_MASK_GROUP)) : undefined;
    if (softMaskGroup instanceof PDFStream) {
        nested.push(softMaskGroup);
    }

    return nested;
}

function isNumber(value: PDFObject | undefined, expected: number): boolean {
    return value instanceof PDFNumber && value.asNumber() === expected;
}

function buildPrunedResources(
    context: PDFContext,
    resources: PDFDict,
    usedNames: Set<PDFName>,
    countRemoved: () => void,
): PDFDict {
    const pruned = context.obj({});
    for (const [category, value] of resources.entries()) {
        const categoryDict = context.lookup(value);
        if (!PRUNABLE_RESOURCE_CATEGORIES.has(category) || !(categoryDict instanceof PDFDict)) {
            pruned.set(category, value);
            continue;
        }
        const keptEntries = context.obj({});
        for (const [name, entry] of categoryDict.entries()) {
            const isImplicit = category === COLOR_SPACE && name.decodeText().startsWith(IMPLICIT_COLOR_SPACE_PREFIX);
            if (usedNames.has(name) || isImplicit) {
                keptEntries.set(name, entry);
            } else {
                countRemoved();
            }
        }
        pruned.set(category, keptEntries);
    }
    return pruned;
}

function findInheritedResources(context: PDFContext, leaf: PDFPageLeaf): PDFDict | undefined {
    const visited = new Set<PDFDict>();
    let node: PDFObject | undefined = leaf;
    while (node instanceof PDFDict && !visited.has(node)) {
        visited.add(node);
        const resources = context.lookup(node.get(RESOURCES));
        if (resources instanceof PDFDict) return resources;
        node = context.lookup(node.get(PARENT));
    }
    return undefined;
}

function stripAncestorResources(context: PDFContext, leaf: PDFPageLeaf): void {
    const visited = new Set<PDFDict>();
    let node = context.lookup(leaf.get(PARENT));
    while (node instanceof PDFPageTree && !visited.has(node)) {
        visited.add(node);
        node.delete(RESOURCES);
        node = context.lookup(node.get(PARENT));
    }
}

function getStreams(context: PDFContext, value: PDFObject | undefined): PDFStream[] {
    const resolved = context.lookup(value);
    if (resolved instanceof PDFStream) return [resolved];
    if (resolved instanceof PDFArray) {
        return resolved.asArray().flatMap((entry) => getStreams(context, entry));
    }
    return [];
}

// Appearance streams without their own /Resources may fall back to the page's resources.
function getAppearanceStreams(context: PDFContext, leaf: PDFPageLeaf): PDFStream[] {
    const annots = context.lookup(leaf.get(ANNOTS));
    if (!(annots instanceof PDFArray)) return [];
    return annots.asArray().flatMap((annotRef) => {
        const annot = context.lookup(annotRef);
        const appearance = annot instanceof PDFDict ? context.lookup(annot.get(AP)) : undefined;
        if (!(appearance instanceof PDFDict)) return [];
        return appearance.entries().flatMap(([, states]) => {
            const resolved = context.lookup(states);
            const candidates = resolved instanceof PDFDict ? resolved.entries().map(([, s]) => s) : [states];
            return candidates
                .flatMap((candidate) => getStreams(context, candidate))
                .filter((stream) => !(context.lookup(stream.dict.get(RESOURCES)) instanceof PDFDict));
        });
    });
}

function decodeStream(stream: PDFStream): Uint8Array | undefined {
    try {
        if (stream instanceof PDFRawStream) return decodePDFRawStream(stream).decode();
        const unencoded = (stream as { getUnencodedContents?: () => Uint8Array }).getUnencodedContents;
        return unencoded ? unencoded.call(stream) : undefined;
    } catch {
        return undefined;
    }
}

function skipComment(content: Uint8Array, start: number): number {
    let index = start;
    while (index < content.length && content[index] !== CHAR_LINE_FEED && content[index] !== CHAR_CARRIAGE_RETURN) {
        index += 1;
    }
    return index;
}

function skipLiteralString(content: Uint8Array, start: number): number | undefined {
    let depth = 0;
    let index = start;
    while (index < content.length) {
        const byte = content[index];
        if (byte === CHAR_BACKSLASH) {
            index += 2;
            continue;
        }
        if (byte === CHAR_OPEN_PAREN) depth += 1;
        if (byte === CHAR_CLOSE_PAREN) depth -= 1;
        index += 1;
        if (depth === 0) return index;
    }
    return undefined;
}

function readRegularToken(content: Uint8Array, start: number): number {
    let index = start;
    while (index < content.length && !WHITESPACE.has(content[index]) && !DELIMITERS.has(content[index])) {
        index += 1;
    }
    return index;
}

// Inline image data is binary and ends at the first "EI" surrounded by whitespace.
function skipInlineImageData(content: Uint8Array, afterOperator: number): number | undefined {
    for (let index = afterOperator + 1; index + 1 < content.length; index++) {
        const isEndOperator = content[index] === CHAR_E && content[index + 1] === CHAR_I;
        const precededByWhitespace = WHITESPACE.has(content[index - 1]);
        const followedByBoundary = index + 2 >= content.length || WHITESPACE.has(content[index + 2]);
        if (isEndOperator && precededByWhitespace && followedByBoundary) {
            return index + 2;
        }
    }
    return undefined;
}

function toLatin1(content: Uint8Array, start: number, end: number): string {
    let text = "";
    for (let index = start; index < end; index++) {
        text += String.fromCharCode(content[index]);
    }
    return text;
}
