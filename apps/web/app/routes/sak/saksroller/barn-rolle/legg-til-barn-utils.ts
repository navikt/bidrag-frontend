import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils";
import { MYNDYG_BARN_ALDER, type BarnRolle, type SakRedigeringData } from "../sakvisning-schema.ts";

export const MAKS_ALDER_BARN = 24;

export function alderForBarn(person: PersonDto): number {
    return beregnAlderForPerson(person) ?? 0;
}

export function finnValideringsfeilForBarn(
    person: PersonDto,
    roller: SakRedigeringData["roller"],
): string | undefined {
    if (roller.some((rolle) => rolle.fodselsnummer === person.ident)) {
        return person.visningsnavn
            ? `${person.visningsnavn} (${person.ident}) er allerede lagt til i saken`
            : `Dette barnet (${person.ident}) er allerede lagt til`;
    }

    const alder = alderForBarn(person);
    if (alder > MAKS_ALDER_BARN) {
        return `${person.visningsnavn ?? "Barnet"} er ${alder} år og kan ikke legges til. Maks alder er ${MAKS_ALDER_BARN} år.`;
    }

    return undefined;
}

export function lagBarnRolle(person: PersonDto): BarnRolle {
    const alder = alderForBarn(person);
    return {
        fodselsnummer: person.ident,
        foedselsnummer: person.ident,
        type: "BA",
        rolleType: "BA",
        objektnummer: "",
        mottagerErVerge: false,
        navn: person.visningsnavn ?? undefined,
        fødselsdato: person.fødselsdato ?? undefined,
        diskresjonskode: person.diskresjonskode ?? undefined,
        alder,
        erMyndig: alder >= MYNDYG_BARN_ALDER,
    };
}
