import type { PersonDto } from "@bidrag/api/PersonApi";
import { erSammeForelder } from "../../felles/saksregler";
import type { Rolle } from "../../felles/sakvisning-schema";

export function finnDuplikatForelderFeil(roller: Rolle[], rolleType: "BP" | "BM", person: PersonDto): string | null {
    const denAndreForelderenType = rolleType === "BM" ? "BP" : "BM";
    const denAndreForelderen = roller.find((rolle) => rolle.type === denAndreForelderenType);
    return finnFeilHvisDenAndreForelderen(person, rolleType, denAndreForelderen?.fodselsnummer);
}

/** Feilmelding når personen allerede er valgt som den andre forelderen, ellers `null`. */
export function finnFeilHvisDenAndreForelderen(
    person: PersonDto,
    rolleType: "BP" | "BM",
    denAndreForelderensIdent: string | undefined,
): string | null {
    if (!erSammeForelder(person.ident, denAndreForelderensIdent)) {
        return null;
    }

    const personInfo = person.visningsnavn
        ? `${person.visningsnavn} (${person.ident})`
        : person.ident
          ? `Denne personen (${person.ident})`
          : "Denne personen";
    const denAndreForelderenRolle = rolleType === "BM" ? "bidragspliktig" : "bidragsmottaker";

    return `${personInfo} er allerede registrert som ${denAndreForelderenRolle} og kan ikke legges til på nytt.`;
}
