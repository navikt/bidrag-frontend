import { Alert, Loader } from "@navikt/ds-react";
import type { PdfState, SaksDokument } from "../types";

export interface PdfVisningProps {
    selectedDocument?: SaksDokument;
    viewerState: PdfState;
    isMetadataLoading: boolean;
}

export function PdfVisning({ selectedDocument, viewerState, isMetadataLoading }: PdfVisningProps) {
    const isLoading = isMetadataLoading || viewerState.loading;
    const hasError = Boolean(viewerState.error);
    const hasSource = Boolean(viewerState.src);

    return (
        <section style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div
                style={{
                    flex: 1,
                    border: "1px solid var(--a-border-default)",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                    background: "var(--a-surface-default)",
                }}
            >
                {isLoading ? (
                    <div style={{ padding: "2rem" }}>
                        <Loader size="xlarge" title="Laster dokument" />
                    </div>
                ) : hasError ? (
                    <div style={{ padding: "1rem" }}>
                        <Alert variant="error">{viewerState.error}</Alert>
                    </div>
                ) : hasSource ? (
                    <iframe
                        title={selectedDocument?.tittel ?? "Dokument"}
                        src={viewerState.src}
                        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
                    />
                ) : (
                    <div style={{ padding: "1rem" }}>
                        <Alert variant="info">Velg et dokument som kan åpnes for å se innholdet</Alert>
                    </div>
                )}
            </div>
        </section>
    );
}
