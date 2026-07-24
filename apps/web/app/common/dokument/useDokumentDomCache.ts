import { useEffect, useState } from "react";

export function useDokumentDomCache(valgtDokumentId?: string, maxAntall: number = 15) {
    const [cachedeIder, setCachedeIder] = useState<string[]>([]);

    useEffect(() => {
        if (!valgtDokumentId) return;

        setCachedeIder((tidligere) => {
            const utenEksisterende = tidligere.filter((id) => id !== valgtDokumentId);
            return [valgtDokumentId, ...utenEksisterende].slice(0, maxAntall);
        });
    }, [valgtDokumentId, maxAntall]);

    return cachedeIder;
}