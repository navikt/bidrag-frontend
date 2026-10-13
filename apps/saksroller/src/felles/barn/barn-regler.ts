import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { MAKS_ALDER_BARN, MYNDYG_BARN_ALDER } from "../saksregler";

export function alderForBarn(person: PersonDto): number {
    return beregnAlderForPerson(person) ?? 0;
}

/** Barn med kjent alder som ikke er eldre enn maksalderen for barn i en sak. */
export function erUnderMaksAlder(person: PersonDto): boolean {
    const alder = beregnAlderForPerson(person);
    return alder != null && alder <= MAKS_ALDER_BARN;
}

/** Felles personfelter for et barn, med alder og om barnet er myndig. */
export function tilBarn(person: PersonDto) {
    const alder = alderForBarn(person);
    return {
        ident: person.ident,
        navn: person.visningsnavn ?? undefined,
        fødselsdato: person.fødselsdato ?? undefined,
        diskresjonskode: person.diskresjonskode ?? undefined,
        alder,
        erMyndig: alder >= MYNDYG_BARN_ALDER,
    };
}

function personBeskrivelse(person: PersonDto) {
    return person.visningsnavn ? `${person.visningsnavn} (${person.ident})` : `Dette barnet (${person.ident})`;
}

/**
 * Feilmelding når et søkt barn ikke kan legges til, ellers `undefined`.
 * `identerIForslag` er barn som allerede vises som valg, og som skal velges derfra i stedet.
 */
export function validerNyttBarn(
    person: PersonDto,
    { identerISaken, identerIForslag = [] }: { identerISaken: string[]; identerIForslag?: string[] },
): string | undefined {
    if (identerISaken.includes(person.ident)) {
        return person.visningsnavn
            ? `${personBeskrivelse(person)} er allerede lagt til i saken`
            : `${personBeskrivelse(person)} er allerede lagt til`;
    }

    if (identerIForslag.includes(person.ident)) {
        return `${personBeskrivelse(person)} finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.`;
    }

    const alder = beregnAlderForPerson(person);
    if (alder == null) {
        return "Kunne ikke beregne alder for barnet.";
    }
    if (alder > MAKS_ALDER_BARN) {
        return `${person.visningsnavn ?? "Barnet"} er ${alder} år og kan ikke legges til. Maks alder er ${MAKS_ALDER_BARN} år.`;
    }

    return undefined;
}
