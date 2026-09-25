import type { ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";

/** Sann når barnet ikke har registrert både bidragsmottaker og bidragspliktig som foreldre. */
export function harUfullstendigRelasjon(
    relasjon: ForelderBarnRelasjonDto,
    bidragsmottaker: string,
    bidragspliktig: string,
): boolean {
    const foreldre = relasjon.forelderBarnRelasjon
        .filter((i) => i.minRolleForPerson === "BARN")
        .map((i) => i.relatertPersonsIdent);
    return foreldre.length < 2 || !foreldre.includes(bidragsmottaker) || !foreldre.includes(bidragspliktig);
}
