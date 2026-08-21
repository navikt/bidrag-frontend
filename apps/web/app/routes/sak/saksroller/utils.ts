import type { Diskresjonskode } from "./sakvisning-schema.ts";

export const ADRESSEBESKYTTELSE_ENHET = "2103";
export const EGEN_ANSATT_ENHET = "4883";

const diskresjonskodeForklaringer: Record<Diskresjonskode, string> = {
    SPSF: "Strengt fortrolig (kode 6)",
    SPFO: "Fortrolig (kode 7)",
    URIK: "Utenriksadresse",
    MILI: "Militær",
    PEND: "Pendler",
    SVAL: "Svalbard",
    P19: "Paragraf 19 (adressesperre)",
};

export function hentDiskresjonskodeForklaring(kode: Diskresjonskode): string {
    return diskresjonskodeForklaringer[kode];
}
