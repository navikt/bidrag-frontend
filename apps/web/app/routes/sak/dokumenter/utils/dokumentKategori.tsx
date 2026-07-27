/**
 * `dokumentType` på journalposten er I (inngående), U (utgående) eller X (internt notat).
 */
export type DokumentKategori = "inngaende" | "utgaende" | "notat" | "ukjent";

export function utledDokumentKategori(dokumentType?: string | null): DokumentKategori {
    switch (dokumentType) {
        case "I":
            return "inngaende";
        case "U":
            return "utgaende";
        case "X":
            return "notat";
        default:
            return "ukjent";
    }
}

const KATEGORI_TEKST: Record<DokumentKategori, string> = {
    inngaende: "I",
    utgaende: "U",
    notat: "X",
    ukjent: "-",
};

const KATEGORI_BESKRIVELSE: Record<DokumentKategori, string> = {
    inngaende: "Inngående dokument",
    utgaende: "Utgående dokument",
    notat: "Internt notat",
    ukjent: "Ukjent dokumenttype",
};

/**
 * Full beskrivelse av dokumenttypen, til bruk som tooltip/aria-label der kun kodebokstaven vises.
 */
export function dokumentKategoriBeskrivelse(dokumentType?: string | null): string {
    return KATEGORI_BESKRIVELSE[utledDokumentKategori(dokumentType)];
}

export function DokumentKategoriTag({ dokumentType }: { dokumentType?: string | null }) {
    const kategori = utledDokumentKategori(dokumentType);
    if (kategori === "ukjent") return <span>-</span>;

    return <span title={KATEGORI_BESKRIVELSE[kategori]}>{KATEGORI_TEKST[kategori]}</span>;
}
