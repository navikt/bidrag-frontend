import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { tilBarn } from "../../felles/barn/barn-regler";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";

const tilBarnMedAlder = (person: PersonDto): BarnMedAlder => ({ ...tilBarn(person), navn: person.visningsnavn });

export function grupperBarnIKurver(relasjoner: MotpartBarnRelasjon[]): Barnkurv[] {
    return relasjoner.map((rel, index) => {
        const barnMedAlder: BarnMedAlder[] = rel.fellesBarn.map(tilBarnMedAlder);
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
