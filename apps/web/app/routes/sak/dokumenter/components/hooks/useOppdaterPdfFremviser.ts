import type { DokumentMetadata } from "@bidrag/api/BidragDokumentApi";
import { useEffect, useState } from "react";
import { useHentSaksdokumentPdf } from "~/api/useApi.ts";
import { estimatePageCountFromArrayBuffer, toPdfSource } from "~/common/components/utils/pdfUtils";

import type { PdfState, SaksDokument } from "../../types";

export function useOppdaterPdfFremviser(
    selectedDocument: SaksDokument | undefined,
    metadata: DokumentMetadata[],
    gjelderMetadata: boolean,
    isMetadataLoading: boolean,
): PdfState {
    const klarForHenting = Boolean(selectedDocument?.kanAapnes) && (!gjelderMetadata || !isMetadataLoading);
    const dokumentFormat = metadata.length === 1 ? metadata[0]?.format : undefined;

    const {
        data: cachedResponse,
        isFetching,
        error,
    } = useHentSaksdokumentPdf(
        selectedDocument?.journalpostId,
        selectedDocument?.dokumentreferanse,
        dokumentFormat,
        klarForHenting,
    );

    const isLoading = isFetching || (gjelderMetadata && isMetadataLoading);
    const errorMessage = error instanceof Error ? error.message : undefined;

    const [pdfSrc, setPdfSrc] = useState<string | undefined>();
    const [pageCount, setPageCount] = useState<number | undefined>();

    useEffect(() => {
        if (!cachedResponse) {
            setPdfSrc(undefined);
            return;
        }

        if (cachedResponse.type === "URL") {
            setPdfSrc(cachedResponse.payload as string);
            return;
        }

        const { src, pageBuffer, isBlobUrl } = toPdfSource(cachedResponse.payload);
        setPdfSrc(src);
        setPageCount(pageBuffer ? estimatePageCountFromArrayBuffer(pageBuffer) : undefined);

        return () => {
            if (isBlobUrl && src) {
                URL.revokeObjectURL(src);
            }
        };
    }, [cachedResponse]);

    if (!selectedDocument) return { loading: false };
    if (!selectedDocument.kanAapnes)
        return { loading: false, error: selectedDocument.aapenForklaring ?? "Kan ikke åpnes" };
    if (errorMessage) return { loading: false, error: errorMessage };

    return {
        loading: isLoading,
        src: pdfSrc,
        pageCount: pageCount,
    };
}
