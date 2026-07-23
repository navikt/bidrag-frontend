export function estimatePageCountFromArrayBuffer(file: ArrayBuffer): number | undefined {
    try {
        const decoded = new TextDecoder("latin1").decode(file);
        const matches = decoded.match(/\/Type\s*\/Page\b/g);
        return matches?.length;
    } catch {
        return undefined;
    }
}

export function toPdfSource(response: unknown): { src?: string; pageBuffer?: ArrayBuffer; isBlobUrl: boolean } {
    if (response instanceof ArrayBuffer) {
        const src = URL.createObjectURL(new Blob([response], { type: "application/pdf" }));
        return { src, pageBuffer: response, isBlobUrl: true };
    }
    if (response instanceof Uint8Array) {
        const pageBuffer = response.buffer instanceof ArrayBuffer ? response.buffer : undefined;
        const src = URL.createObjectURL(new Blob([response as unknown as BlobPart], { type: "application/pdf" }));
        return { src, pageBuffer, isBlobUrl: true };
    }
    if (response instanceof Blob) {
        const src = URL.createObjectURL(response);
        return { src, isBlobUrl: true };
    }
    if (typeof response === "string") {
        const verdi = response.trim();
        if (!verdi) {
            return { isBlobUrl: false };
        }

        const erStandardUrl =
            verdi.startsWith("data:application/pdf") ||
            verdi.startsWith("blob:") ||
            verdi.startsWith("http://") ||
            verdi.startsWith("https://");
        if (erStandardUrl) {
            return { src: verdi, isBlobUrl: false };
        }

        if (verdi.startsWith("JVBER") || isLikelyBase64(verdi)) {
            const formatertBase64 = `data:application/pdf;base64,${verdi.replace(/\s/g, "")}`;
            return { src: formatertBase64, isBlobUrl: false };
        }
    }
    return { isBlobUrl: false };
}

function isLikelyBase64(value: string): boolean {
    const normalized = value.replace(/\s/g, "");
    if (normalized.length < 16 || normalized.length % 4 !== 0) {
        return false;
    }
    return /^[A-Za-z0-9+/=]+$/.test(normalized);
}