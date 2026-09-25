import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import {
    type BarnebidragForelderRolle,
    type ForelderPart,
    type ForelderPartRolle,
    MAKS_ALDER_BARN,
} from "../../skjema/opprett-sak-schema";

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

export function rolleSomPart(roller: BarnebidragForelderRolle[], type: "BP" | "BM"): ForelderPart {
    const rolle = roller.find((r) => r.type === type);
    return {
        ident: rolle?.ident ?? "",
        navn: rolle?.navn ?? "",
        erKjent: rolle?.erKjent,
        diskresjonskode: rolle?.diskresjonskode,
    };
}

/** Hvem som havner i hvert kort når en person velges. Står personen i det andre kortet, byttes rollene. */
export function rollerEtterValg(
    roller: BarnebidragForelderRolle[],
    rolle: ForelderPartRolle,
    person: PersonDto,
    forslag: PersonDto[],
): BarnebidragForelderRolle[] {
    const type = rolle === "bidragspliktig" ? "BP" : "BM";
    const motsattType = type === "BP" ? "BM" : "BP";
    const valgt = roller.find((r) => r.type === type);
    const andre = roller.find((r) => r.type === motsattType);
    const andreEtterValg = andre?.ident === person.ident ? valgt : andre;
    const gjenstående = forslag.filter((f) => f.ident !== person.ident);
    const fyllUt = andreEtterValg?.erKjent === undefined && gjenstående.length === 1;
    const oppdaterte = new Map<string, Partial<ForelderPart>>([
        [type, tilPart(person)],
        [motsattType, fyllUt ? tilPart(gjenstående[0] as PersonDto) : utenType(andreEtterValg)],
    ]);
    return roller.map((rolle) => ({ ...rolle, ...oppdaterte.get(rolle.type) }));
}

function utenType(rolle: BarnebidragForelderRolle | undefined): ForelderPart {
    if (!rolle) return {};
    const { type: _, ...part } = rolle;
    return part;
}

/** Samme motpart registrert med ulike forelderroller (f.eks. både mor og far) er en datafeil. */
export function harMotpartMedUlikeForelderroller(relasjoner: MotpartBarnRelasjon[]): boolean {
    return relasjoner.some((relasjon) =>
        relasjoner.some(
            (r) =>
                r.motpart?.ident === relasjon.motpart?.ident &&
                r.forelderrolleMotpart !== relasjon.forelderrolleMotpart,
        ),
    );
}

/** Barnkurver for en forelder: bare barn opp til og med 24 år, slått sammen per motpart og forelderrolle. */
export function utledBarnkurverForForelder(relasjoner: MotpartBarnRelasjon[]): MotpartBarnRelasjon[] {
    const barnkurver: MotpartBarnRelasjon[] = [];
    for (const relasjon of relasjoner) {
        const fellesBarn = relasjon.fellesBarn.filter((barn) => {
            const alder = beregnAlderForPerson(barn);
            return alder !== null && alder <= MAKS_ALDER_BARN;
        });
        if (fellesBarn.length === 0) continue;
        const eksisterende = barnkurver.find(
            (r) =>
                r.motpart?.ident === relasjon.motpart?.ident &&
                r.forelderrolleMotpart === relasjon.forelderrolleMotpart,
        );
        if (eksisterende) eksisterende.fellesBarn = [...eksisterende.fellesBarn, ...fellesBarn];
        else barnkurver.push({ ...relasjon, fellesBarn });
    }
    return barnkurver;
}
