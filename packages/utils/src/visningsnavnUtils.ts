import { Sakskategori } from "../features/saksrolleroversikt/saksrolleroversiktContext";

const SAKSKATEGORI_ENUM_MAP: Record<string, string> = {
    Nasjonal: "N",
    N: "N",
    Utland: "U",
    U: "U",
};

const SAKSKATEGORI_VISNINGSNAVN_MAP: Record<string, string> = {
    Nasjonal: "Nasjonal",
    N: "Nasjonal",
    Utland: "Utland",
    U: "Utland",
};

export function sakskategoriTilEnum(sakskategori?: string): string | undefined {
    return sakskategori ? SAKSKATEGORI_ENUM_MAP[sakskategori] : undefined;
}

export function sakskategoriTilVisningsnavn(sakskategori: Sakskategori): string {
    return SAKSKATEGORI_VISNINGSNAVN_MAP[sakskategori] ?? sakskategori;
}
