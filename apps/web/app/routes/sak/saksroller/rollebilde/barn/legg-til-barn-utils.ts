import type { PersonDto } from "@bidrag/api/PersonApi";
import { tilBarn } from "../../felles/barn/barn-regler.ts";
import type { BarnRolle } from "../../felles/sakvisning-schema.ts";

export function lagBarnRolle(person: PersonDto): BarnRolle {
    const { ident, ...barn } = tilBarn(person);
    return {
        ...barn,
        fodselsnummer: ident,
        foedselsnummer: ident,
        type: "BA",
        rolleType: "BA",
        objektnummer: "",
        mottagerErVerge: false,
    };
}
