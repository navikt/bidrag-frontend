import { Alert, Loader, VStack } from "@navikt/ds-react";
import { useEffect, useMemo } from "react";
import { useHentSaksdokumentPdf } from "~/api/useApi.ts";
import { toPdfSource } from "~/common/components/utils/pdfUtils";

export interface PdfDokument {
    journalpostId?: string;
    dokumentreferanse?: string;
    dokumentFormat?: string;
    tittel: string;
    kanÅpnes: boolean;
    åpenForklaring?: string;
}

export interface PdfVisningProps {
    dokument?: PdfDokument;
    lasterMetadata?: boolean;
}

export function PdfVisning({ dokument, lasterMetadata = false }: PdfVisningProps) {
    const kanHente = Boolean(dokument?.kanÅpnes) && !lasterMetadata;

    const {
        data: cachedResponse,
        isFetching,
        error,
    } = useHentSaksdokumentPdf(
        dokument?.journalpostId,
        dokument?.dokumentreferanse,
        dokument?.dokumentFormat,
        kanHente,
    );

    const pdfSource = useMemo(() => {
        if (!cachedResponse) return null;
        if (cachedResponse.type === "URL") return { src: cachedResponse.payload as string, isBlobUrl: false };
        return toPdfSource(cachedResponse.payload);
    }, [cachedResponse]);

    useEffect(
        function cleanupBlobUrl() {
            return () => {
                if (pdfSource?.isBlobUrl && pdfSource.src) {
                    URL.revokeObjectURL(pdfSource.src);
                }
            };
        },
        [pdfSource],
    );

    if (!dokument) {
        return (
            <VStack align="center" justify="center" style={{ flex: 1, padding: "var(--a-spacing-16)" }}>
                <Alert variant="info">Velg et dokument som kan åpnes for å se innholdet</Alert>
            </VStack>
        );
    }

    if (!dokument.kanÅpnes) {
        return (
            <VStack align="center" justify="center" style={{ flex: 1, padding: "var(--a-spacing-16)" }}>
                <Alert variant="error">{dokument.åpenForklaring ?? "Kan ikke åpnes"}</Alert>
            </VStack>
        );
    }

    if (isFetching || lasterMetadata) {
        return (
            <VStack align="center" justify="center" style={{ flex: 1 }}>
                <Loader size="xlarge" title="Laster dokument" />
            </VStack>
        );
    }

    if (error) {
        return (
            <VStack align="center" justify="center" style={{ flex: 1, padding: "var(--a-spacing-16)" }}>
                <Alert variant="error">{error.message}</Alert>
            </VStack>
        );
    }

    if (!pdfSource?.src) {
        return (
            <VStack align="center" justify="center" style={{ flex: 1, padding: "var(--a-spacing-16)" }}>
                <Alert variant="error">Dokumentformat støttes ikke</Alert>
            </VStack>
        );
    }

    return (
        <section
            style={{
                flex: 1,
                minWidth: 0,
                position: "sticky",
                top: "1rem",
                height: "calc(100vh - 4rem)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <iframe
                title={dokument.tittel}
                src={`${pdfSource.src}#view=FitH`}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
        </section>
    );
}
