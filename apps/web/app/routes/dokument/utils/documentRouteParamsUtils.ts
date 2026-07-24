export interface DocumentOpenOptions {
    resizeToA4: boolean;
    optimizeForPrint: boolean;
    openInNewTab: boolean;
}

export interface DokumentReference {
    journalpostId: string;
    dokumentreferanse: string;
}

function readBoolean(searchParams: URLSearchParams, key: string, fallback: boolean): boolean {
    const value = searchParams.get(key);
    return value === null ? fallback : value === "true";
}

export function getDocumentOpenOptions(searchParams: URLSearchParams): DocumentOpenOptions {
    return {
        resizeToA4: readBoolean(searchParams, "resizeToA4", false),
        optimizeForPrint: readBoolean(searchParams, "optimizeForPrint", true),
        openInNewTab: searchParams.has("openInNewTab")
            ? readBoolean(searchParams, "openInNewTab", false)
            : readBoolean(searchParams, "openInNewWindow", false),
    };
}

export function parseDokumentReference(value: string): DokumentReference | null {
    const [journalpostId, ...rest] = value.split(":");
    const dokumentreferanse = rest.join(":");
    if (!journalpostId || !dokumentreferanse) {
        return null;
    }

    return { journalpostId, dokumentreferanse };
}
