import { type PdfDokument, PdfVisning } from "./PdfVisning";
import { useDokumentDomCache } from "./useDokumentDomCache";

export interface DomCachedPdfFremviserProps {
    dokumenter: PdfDokument[];
    valgtDokumentreferanse?: string;
    lasterMetadata?: boolean;
    maxCache?: number;
}

export function DomCachedPdfFremviser({
    dokumenter,
    valgtDokumentreferanse,
    lasterMetadata = false,
    maxCache = 15,
}: DomCachedPdfFremviserProps) {
    const domCachedIds = useDokumentDomCache(valgtDokumentreferanse, maxCache);
    const filtrerteDokumenter = dokumenter.filter(
        (dok) => dok.dokumentreferanse && domCachedIds.includes(dok.dokumentreferanse),
    );

    return (
        <div style={{ flex: 1, overflow: "hidden" }}>
            {filtrerteDokumenter.map((dokument) => {
                const erValgt = valgtDokumentreferanse === dokument.dokumentreferanse;

                return (
                    <div
                        key={dokument.dokumentreferanse}
                        style={{
                            height: "100%",
                            display: erValgt ? "block" : "none",
                        }}
                    >
                        <PdfVisning dokument={dokument} lasterMetadata={erValgt ? lasterMetadata : false} />
                    </div>
                );
            })}
        </div>
    );
}
