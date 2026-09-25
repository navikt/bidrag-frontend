import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { type Barnkurv, type BarnMedAlder, MYNDYG_BARN_ALDER } from "../skjema/opprett-sak-schema";

function leggTilAlderPåBarn(barn: PersonDto[]): BarnMedAlder[] {
    return barn.map((person) => {
        const alder = beregnAlderForPerson(person) ?? 0;

        return {
            ident: person.ident,
            navn: person.visningsnavn,
            fødselsdato: person.fødselsdato ?? undefined,
            alder,
            erMyndig: alder >= MYNDYG_BARN_ALDER,
            diskresjonskode: person.diskresjonskode,
        };
    });
}

export function grupperBarnIKurver(relasjoner: MotpartBarnRelasjon[]): Barnkurv[] {
    return relasjoner.map((rel, index) => {
        const barnMedAlder = leggTilAlderPåBarn(rel.fellesBarn);
        const sorterteBarn = barnMedAlder.sort((a, b) => b.alder - a.alder);

        return {
            id: rel.motpart?.ident ?? `UKJENT${index + 1}`,
            motpart: rel.motpart
                ? {
                      ident: rel.motpart.ident ?? "",
                      visningsnavn: rel.motpart.visningsnavn ?? "",
                      fødselsdato: rel.motpart.fødselsdato ?? "",
                      diskresjonskode: rel.motpart.diskresjonskode ?? undefined,
                  }
                : null,
            forelderrolle: rel.forelderrolleMotpart,
            barn: sorterteBarn,
        };
    });
}
