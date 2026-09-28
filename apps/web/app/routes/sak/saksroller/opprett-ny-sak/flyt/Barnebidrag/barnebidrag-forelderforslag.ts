import type { PersonDto } from "@bidrag/api/PersonApi";

export type ForeldreTilBarn = { barn: { ident: string; navn: string }; foreldre: PersonDto[] | undefined };

type Forelderforslag = { forslag: PersonDto[]; feil?: string };

/**
 * Registrerte foreldre til valgte barn, som forslag til BP/BM-kortene.
 * Gir en advarsel når et barn har begge foreldre registrert og en valgt forelder ikke er en av dem.
 */
export function utledForelderforslag({
    foreldreTilBarn,
    valgteForeldre,
}: {
    foreldreTilBarn: ForeldreTilBarn[];
    valgteForeldre: { ident: string; navn: string }[];
}): Forelderforslag {
    const forslag = new Map<string, PersonDto>();
    let feil: string | undefined;

    for (const { barn, foreldre = [] } of foreldreTilBarn) {
        if (foreldre.length > 2) {
            feil = `Dette barnet (${barn.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`;
            continue;
        }
        const ikkeForelder = valgteForeldre.find((valgt) => !foreldre.some((f) => f.ident === valgt.ident));
        if (ikkeForelder && foreldre.length === 2) {
            feil ??= `Er du sikker på at dette er riktig barn? Dette barnet (${barn.ident}) har begge foreldre registrert, men ${ikkeForelder.navn} (${ikkeForelder.ident}) er ikke en av dem.`;
        }
        for (const forelder of foreldre) forslag.set(forelder.ident, forelder);
    }

    return { forslag: [...forslag.values()], feil };
}

/**
 * `false` når minst ett valgt barn ikke har både BP og BM som registrerte foreldre.
 * `undefined` mens foreldreinformasjon lastes, slik at varselet ikke blinker.
 */
export function harFullstendigRelasjon(
    foreldreTilBarn: ForeldreTilBarn[],
    bidragspliktigIdent?: string,
    bidragsmottakerIdent?: string,
): boolean | undefined {
    if (foreldreTilBarn.length === 0) return true;
    if (foreldreTilBarn.some((b) => b.foreldre === undefined)) return undefined;
    if (!bidragspliktigIdent || !bidragsmottakerIdent) return false;
    return foreldreTilBarn.every(({ foreldre = [] }) => {
        const identer = foreldre.map((f) => f.ident);
        return identer.includes(bidragspliktigIdent) && identer.includes(bidragsmottakerIdent);
    });
}
