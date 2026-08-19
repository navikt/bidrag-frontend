const fullPathRouteMaskRules: ReadonlyArray<readonly [RegExp, string]> = [
    [/^\/log\/[^/]+$/, "/log/{type}"],
    [/^\/bisys\/[^/]+$/, "/bisys/{target}"],
    [/^\/aapnedokument\/[^/]+\/[^/]+$/, "/aapnedokument/{journalpostId}/{dokumentreferanse}"],
    [/^\/dokument\/[^/]+\/[^/]+$/, "/dokument/{journalpostId}/{dokumentreferanse}"],
    [/^\/dokument\/[^/]+$/, "/dokument/{journalpostId}"],
    [/^\/admin\/endringslogg\/[^/]+$/, "/admin/endringslogg/{id}"],
];

const partialPathRouteMaskRules: ReadonlyArray<readonly [RegExp, string]> = [
    [/\/bruker\/[^/]+/, "/bruker/{id}"],
    [/\/sak\/[^/]+/, "/sak/{saksnummer}"],
    [/\/sak\/{saksnummer}\/journal\/[^/]+$/, "/sak/{saksnummer}/journal/{journalpostId}"],
    [/\/sak\/{saksnummer}\/vedtak\/[^/]+$/, "/sak/{saksnummer}/vedtak/{vedtaksid}"],
];

const uuidSegmentPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fnrSegmentPattern = /^\d{11}$/;
const saksnummerSegmentPattern = /^\d{7}$/;
const numericSegmentPattern = /^\d+$/;
const maskedSegmentPattern = /^{[^}]+}$/;

function applyRouteMask(pathname: string): string {
    for (const [pattern, replacement] of fullPathRouteMaskRules) {
        if (pattern.test(pathname)) {
            return replacement;
        }
    }

    let maskedPath = pathname;
    for (const [pattern, replacement] of partialPathRouteMaskRules) {
        maskedPath = maskedPath.replace(pattern, replacement);
    }

    return maskedPath;
}

function applyFallbackMask(pathname: string): string {
    return pathname
        .split("/")
        .map((segment) => {
            if (!segment || maskedSegmentPattern.test(segment)) {
                return segment;
            }

            if (uuidSegmentPattern.test(segment)) {
                return "{uuid}";
            }

            if (fnrSegmentPattern.test(segment)) {
                return "{fnr}";
            }

            if (saksnummerSegmentPattern.test(segment)) {
                return "{saksnummer}";
            }

            if (numericSegmentPattern.test(segment)) {
                return "{id}";
            }

            return segment;
        })
        .join("/");
}

export function maskPathnameForPageId(pathname: string): string {
    return applyFallbackMask(applyRouteMask(pathname));
}
