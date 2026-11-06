import type { PersonDto } from "@bidrag/api/PersonApi";
import { harAnnenRegistrertForelder } from "../../../felles/relasjon/annen-forelder";

export type ForeldreTilBarn = { barn: { ident: string; navn: string }; foreldre: PersonDto[] | undefined };

type Forelderforslag = { forslag: PersonDto[]; feil?: string };

/**
 * Registrerte foreldre til valgte barn, som forslag til BP/BM-kortene.
 */
export function utledForelderforslag({ foreldreTilBarn }: { foreldreTilBarn: ForeldreTilBarn[] }): Forelderforslag {
    const forslag = new Map<string, PersonDto>();
    let feil: string | undefined;

    for (const { barn, foreldre = [] } of foreldreTilBarn) {
        if (foreldre.length > 2) {
            feil = `Dette barnet (${barn.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`;
            continue;
        }
        for (const forelder of foreldre) forslag.set(forelder.ident, forelder);
    }

    return { forslag: [...forslag.values()], feil };
}

/**
 * Valgte barn som ikke har alle kjente foreldre (BP og BM) registrert som foreldre.
 * `undefined` mens foreldreinformasjon lastes, slik at varselet ikke blinker.
 */
export function barnMedUfullstendigRelasjon(
    foreldreTilBarn: ForeldreTilBarn[],
    bidragspliktigIdent?: string,
    bidragsmottakerIdent?: string,
): ForeldreTilBarn["barn"][] | undefined {
    if (foreldreTilBarn.some((b) => b.foreldre === undefined)) return undefined;
    const kjenteForeldre = [bidragspliktigIdent, bidragsmottakerIdent].filter((ident): ident is string => !!ident);
    return foreldreTilBarn
        .filter(({ foreldre = [] }) => {
            const identer = foreldre.map((f) => f.ident);
            return !kjenteForeldre.every((ident) => identer.includes(ident));
        })
        .map(({ barn }) => barn);
}

/** Valgte barn der Folkeregisteret har en annen forelder enn valgt BP eller BM. */
export function barnMedAnnenForelder(
    foreldreTilBarn: ForeldreTilBarn[],
    valgteForeldre: (string | undefined)[],
): ForeldreTilBarn["barn"][] {
    return foreldreTilBarn
        .filter(({ foreldre = [] }) =>
            harAnnenRegistrertForelder(
                foreldre.map((f) => f.ident),
                valgteForeldre,
            ),
        )
        .map(({ barn }) => barn);
}
