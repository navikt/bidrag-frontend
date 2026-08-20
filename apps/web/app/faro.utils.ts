// Rekkefølgen er signifikant: mer spesifikke/anchored mønstre må stå før generiske,
// og sak/:saksnummer må erstattes før de sammensatte sak-understi-reglene som bruker den.
const routeMaskRules: ReadonlyArray<readonly [RegExp, string]> = [
    [/^\/log\/[^/]+$/, "/log/:type"],
    [/^\/bisys\/[^/]+$/, "/bisys/:target"],
    [/^\/aapnedokument\/[^/]+\/[^/]+$/, "/aapnedokument/:journalpostId/:dokumentreferanse"],
    [/^\/dokument\/[^/]+\/[^/]+$/, "/dokument/:journalpostId/:dokumentreferanse"],
    [/^\/dokument\/[^/]+$/, "/dokument/:journalpostId"],
    [/^\/admin\/endringslogg\/[^/]+$/, "/admin/endringslogg/:id"],
    [/\/bruker\/[^/]+/, "/bruker/:id"],
    [/\/sak\/[^/]+/, "/sak/:saksnummer"],
    [/\/sak\/:saksnummer\/journal\/[^/]+$/, "/sak/:saksnummer/journal/:journalpostId"],
    [/\/sak\/:saksnummer\/vedtak\/[^/]+$/, "/sak/:saksnummer/vedtak/:vedtaksid"],
];

const uuidSegmentPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fnrSegmentPattern = /^\d{11}$/;
const saksnummerSegmentPattern = /^\d{7}$/;
const numericSegmentPattern = /^\d+$/;
const maskedSegmentPattern = /^:[^/]+$/;

// Rekkefølge betyr noe: fnr (11 siffer) og saksnummer (7 siffer) må sjekkes før
// den mer generiske numeriske sjekken.
const fallbackSegmentRules: ReadonlyArray<readonly [RegExp, string]> = [
    [uuidSegmentPattern, ":uuid"],
    [fnrSegmentPattern, ":fnr"],
    [saksnummerSegmentPattern, ":saksnummer"],
    [numericSegmentPattern, ":id"],
];

function applyRouteMask(pathname: string): string {
    return routeMaskRules.reduce(
        (maskedPath, [pattern, replacement]) => maskedPath.replace(pattern, replacement),
        pathname,
    );
}

function applyFallbackMask(pathname: string): string {
    return pathname
        .split("/")
        .map((segment) => {
            if (!segment || maskedSegmentPattern.test(segment)) {
                return segment;
            }

            const rule = fallbackSegmentRules.find(([pattern]) => pattern.test(segment));
            return rule ? rule[1] : segment;
        })
        .join("/");
}

export function maskPathnameForPageId(pathname: string): string {
    return applyFallbackMask(applyRouteMask(pathname));
}
