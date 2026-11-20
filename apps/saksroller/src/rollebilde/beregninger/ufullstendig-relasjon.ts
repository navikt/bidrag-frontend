import type { ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";

export function registrerteForeldre(relasjon: ForelderBarnRelasjonDto): (string | null | undefined)[] {
    return relasjon.forelderBarnRelasjon
        .filter((i) => i.minRolleForPerson === "BARN")
        .map((i) => i.relatertPersonsIdent);
}

/** Sann når barnet ikke har registrert både bidragsmottaker og bidragspliktig som foreldre. */
export function harUfullstendigRelasjon(
    relasjon: ForelderBarnRelasjonDto,
    bidragsmottaker: string,
    bidragspliktig: string,
): boolean {
    const foreldre = registrerteForeldre(relasjon);
    return foreldre.length < 2 || !foreldre.includes(bidragsmottaker) || !foreldre.includes(bidragspliktig);
}
