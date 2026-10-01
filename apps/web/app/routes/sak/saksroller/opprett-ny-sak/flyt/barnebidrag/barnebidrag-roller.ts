import type { PersonDto } from "@bidrag/api/PersonApi";
import type { BarnebidragForelderRolle, ForelderPart, ForelderPartRolle } from "../../skjema/opprett-sak-schema";

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
