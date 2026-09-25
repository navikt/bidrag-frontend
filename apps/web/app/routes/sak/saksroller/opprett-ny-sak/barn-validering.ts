import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import type { Barnkurv } from "./opprett-sak-schema";
import { MAKS_ALDER_BARN } from "./opprett-sak-schema";

function personBeskrivelse(barn: PersonDto) {
    if (barn.visningsnavn && barn.ident) {
        return `${barn.visningsnavn} (${barn.ident})`;
    }
    if (barn.ident) {
        return `Dette barnet (${barn.ident})`;
    }
    return "Dette barnet";
}

function validerIkkeValgt(barn: PersonDto, valgteBarn: { ident: string }[]) {
    if (!valgteBarn.some((valgtBarn) => valgtBarn.ident === barn.ident)) {
        return;
    }

    throw new Error(
        `${personBeskrivelse(barn)} er allerede i listen over valgte barn. Vennligst velg fra listen over tilgjengelige barn over.`,
    );
}

function validerIkkeTilgjengelig(barn: PersonDto, barnkurver: Barnkurv[]) {
    if (!barnkurver.some((kurv) => kurv.barn.some((tilgjengeligBarn) => tilgjengeligBarn.ident === barn.ident))) {
        return;
    }

    throw new Error(
        `${personBeskrivelse(barn)} finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.`,
    );
}

function validerAlder(barn: PersonDto) {
    const alder = beregnAlderForPerson(barn);

    if (alder === null) {
        throw new Error("Kunne ikke beregne alder for barnet.");
    }

    if (alder > MAKS_ALDER_BARN) {
        if (!barn.ident) {
            throw new Error(`Barnet er over ${MAKS_ALDER_BARN} år og kan ikke legges til`);
        }
        throw new Error(
            `${personBeskrivelse(barn)} er ${alder} år og kan ikke legges til i saken. Maks alder er 24 år.`,
        );
    }

    return alder;
}

export function validerBarn(barn: PersonDto, valgteBarn: { ident: string }[], barnkurver: Barnkurv[]) {
    validerIkkeValgt(barn, valgteBarn);
    validerIkkeTilgjengelig(barn, barnkurver);
    return validerAlder(barn);
}
