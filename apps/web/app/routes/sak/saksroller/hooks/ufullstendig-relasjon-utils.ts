import type { ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";

export async function beregnBarnMedUfullstendigRelasjon(
    barn: string[],
    bidragsmottaker: string | undefined,
    bidragspliktig: string | undefined,
    hentRelasjon: (ident: string) => Promise<ForelderBarnRelasjonDto>,
): Promise<string[]> {
    if (!bidragsmottaker || !bidragspliktig) return barn;
    const resultat = await Promise.all(
        barn.map(async (barnIdent) => {
            const relasjon = await hentRelasjon(barnIdent);
            const foreldreIdent = relasjon.forelderBarnRelasjon
                .filter((i) => i.minRolleForPerson === "BARN")
                .map((i) => i.relatertPersonsIdent);
            return foreldreIdent.length < 2 ||
                !foreldreIdent.includes(bidragsmottaker) ||
                !foreldreIdent.includes(bidragspliktig)
                ? barnIdent
                : null;
        }),
    );
    return resultat.filter((ident): ident is string => ident !== null);
}
