import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { type ForelderPart, type ForelderPartRolle, MAKS_ALDER_BARN } from "../../opprett-sak-schema";
import { hentMotsattRolle } from "../../utils";

export type ForeldreTilBarn = { barn: { ident: string; navn: string }; foreldre: PersonDto[] | undefined };

type Forelderforslag = { forslag: PersonDto[]; feil?: string };

/**
 * Registrerte foreldre til valgte barn, som forslag til BP/BM-kortene.
 * Samme regel uansett om saken startet fra en forelder eller fra barnet.
 */
export function utledForelderforslag({
    foreldreTilBarn,
    låstForelder,
    valgteIdenter,
}: {
    foreldreTilBarn: ForeldreTilBarn[];
    låstForelder?: { ident: string; navn: string };
    valgteIdenter: string[];
}): Forelderforslag {
    const forslag = new Map<string, PersonDto>();
    let feil: string | undefined;

    for (const { barn, foreldre = [] } of foreldreTilBarn) {
        if (foreldre.length > 2) {
            feil = `Dette barnet (${barn.ident}) har flere enn 2 registrerte foreldre i systemet. Dette kan skyldes feil i data. Kontakt support.`;
            continue;
        }
        if (låstForelder && foreldre.length === 2 && !foreldre.some((f) => f.ident === låstForelder.ident)) {
            feil ??= `Er du sikker på at dette er riktig barn? Dette barnet (${barn.ident}) har begge foreldre registrert, men ${låstForelder.navn} (${låstForelder.ident}) er ikke en av dem.`;
        }
        for (const forelder of foreldre) {
            if (forelder.ident !== låstForelder?.ident && !valgteIdenter.includes(forelder.ident)) {
                forslag.set(forelder.ident, forelder);
            }
        }
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

/**
 * 🔴 Barn BP har sammen med valgt BM, som valgbare barn i saken. Bare relasjonen med BM brukes,
 * så barn fra andre forhold vises aldri. Barn som allerede er lagt til manuelt, utelates.
 */
export function utledFellesBarn(
    relasjonerTilBp: MotpartBarnRelasjon[] | undefined,
    bidragsmottakerIdent: string | undefined,
    manueltLagtTil: string[],
): MotpartBarnRelasjon | null {
    const relasjon = relasjonerTilBp?.find((r) => !!bidragsmottakerIdent && r.motpart?.ident === bidragsmottakerIdent);
    const fellesBarn =
        relasjon?.fellesBarn.filter((barn) => {
            const alder = beregnAlderForPerson(barn);
            return alder !== null && alder <= MAKS_ALDER_BARN && !manueltLagtTil.includes(barn.ident);
        }) ?? [];
    return relasjon && fellesBarn.length > 0 ? { ...relasjon, fellesBarn } : null;
}

export function tilPart(person: PersonDto): ForelderPart {
    return {
        ident: person.ident,
        navn: person.visningsnavn,
        erKjent: true,
        diskresjonskode: person.diskresjonskode,
    };
}

export type Parter = Record<ForelderPartRolle, ForelderPart>;

/** Hvem som havner i hvert kort når en person velges. Står personen i det andre kortet, byttes rollene. */
export function parterEtterValg(
    parter: Parter,
    rolle: ForelderPartRolle,
    person: PersonDto,
    forslag: PersonDto[],
    låstForelder: ForelderPartRolle | null,
): Parter {
    const motsatt = hentMotsattRolle(rolle);
    const andre = parter[motsatt].ident === person.ident ? parter[rolle] : parter[motsatt];
    const gjenstående = forslag.filter((f) => f.ident !== person.ident);
    const fyllUt = motsatt !== låstForelder && andre.erKjent === undefined && gjenstående.length === 1;
    return {
        [rolle]: tilPart(person),
        [motsatt]: fyllUt ? tilPart(gjenstående[0] as PersonDto) : andre,
    } as Parter;
}
