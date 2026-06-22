export const arbeidsfordelingMap = {
    EIERENHET: { kode: "EEN", behandlingstema: null },
    FARSKAP: { kode: "FRS", behandlingstema: "ab0322" },
    EKTEFELLLESAK: { kode: "EFS", behandlingstema: "ab0325" },
    OPPFOSTRINGSSAK: { kode: "OPS", behandlingstema: "ab0324" },
    REISEKOSTNADSAK: { kode: "RKS", behandlingstema: "ab0129" },
};

export function arbeidsfordelingTilBehandlingstema(arbeidsfordeling: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS") {
    return Object.values(arbeidsfordelingMap).find((af) => af.kode === arbeidsfordeling)?.behandlingstema ?? null;
}
