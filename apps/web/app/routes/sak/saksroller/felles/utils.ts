import type { ISamhandlerPersonInfo } from "~/api/types/person.ts";
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

/**
 * Returnerer en infomelding når oppgitt ident avviker fra identen som faktisk ble funnet
 * (personen har fått nytt fødselsnummer), slik at brukeren varsles om at det nyeste
 * fødselsnummeret er tatt i bruk. Returnerer `undefined` når identene er like.
 */
export function hentNyttFødselsnummerMelding(
    treff: Pick<ISamhandlerPersonInfo, "ident" | "søktIdent">,
): string | undefined {
    if (!treff.ident || !treff.søktIdent || treff.ident === treff.søktIdent) {
        return undefined;
    }

    return `Personen har fått nytt fødselsnummer. Bruker nyeste fødselsnummer ${treff.ident}.`;
}
