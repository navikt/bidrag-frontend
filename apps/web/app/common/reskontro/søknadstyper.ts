const SOKNADSTYPER: Record<string, string> = {
    EN: "Endring",
    ET: "Eget tiltak",
    FA: "Søknad",
    IG: "Innkr.grunnlag",
    IR: "Indeksreg.",
    KB: "Klage begr sats",
    KL: "Klage",
    KM: "Følger klage",
    KR: "Korrigering",
    OH: "Opphør",
    PA: "Privat avtale",
    RB: "Begr.revurd.",
    RF: "Revurdering",
    MP: "Månedlig påløp",
};

export function visningsnavnForSøknadstype(kode?: string | null): string | null {
    if (!kode) return null;
    return SOKNADSTYPER[kode] ?? kode;
}
