import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { erUnderMaksAlder, tilBarn } from "../../felles/barn/barn-regler";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";

const tilBarnMedAlder = (person: PersonDto): BarnMedAlder => ({ ...tilBarn(person), navn: person.visningsnavn });

export function grupperBarnIKurver(relasjoner: MotpartBarnRelasjon[], forelder?: Barnkurv["forelder"]): Barnkurv[] {
    return relasjoner.map((rel, index) => {
        const barnMedAlder: BarnMedAlder[] = rel.fellesBarn.filter(erUnderMaksAlder).map(tilBarnMedAlder);
        const sorterteBarn = barnMedAlder.sort((a, b) => b.alder - a.alder);

        return {
            forelder,
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

export function slåSammenBarnkurver(barnkurver: Barnkurv[], søskenkurver: Barnkurv[], harManuelleBarn: boolean) {
    const resultat: Barnkurv[] = [];
    const grupper = new Map<string, Barnkurv>();
    const visteBarnPerGruppe = new Map<string, Set<string>>();
    const kurverFraForeldre = harManuelleBarn ? [] : barnkurver;

    for (const kurv of [...kurverFraForeldre, ...søskenkurver]) {
        const { gruppenøkkel: nøkkel, id } = barnkurvNøkler(kurv);
        const dedupliseringsnøkkel = harManuelleBarn ? nøkkel : "alle-barn";
        const settForGruppe = visteBarnPerGruppe.get(dedupliseringsnøkkel) ?? new Set<string>();
        const nyeBarn = kurv.barn.filter((barn) => {
            if (settForGruppe.has(barn.ident)) return false;
            settForGruppe.add(barn.ident);
            return true;
        });
        visteBarnPerGruppe.set(dedupliseringsnøkkel, settForGruppe);
        if (nyeBarn.length === 0) continue;

        const eksisterende = grupper.get(nøkkel);
        if (eksisterende) {
            eksisterende.barn.push(...nyeBarn);
            continue;
        }

        const forelderKurv = barnkurver.find((kandidat) => foreldreparNøkkel(kandidat) === nøkkel);
        const nyKurv = { ...(forelderKurv ?? kurv), id, barn: nyeBarn };
        grupper.set(nøkkel, nyKurv);
        resultat.push(nyKurv);
    }

    return resultat;
}

function barnkurvNøkler(kurv: Barnkurv) {
    const foreldrepar = foreldreparNøkkel(kurv);
    if (foreldrepar) return { gruppenøkkel: foreldrepar, id: foreldrepar };
    if (kurv.motpart) return { gruppenøkkel: `motpart-${kurv.motpart.ident}`, id: kurv.id };
    return { gruppenøkkel: "ukjent-forelder", id: "UKJENT" };
}

function foreldreparNøkkel(kurv: Barnkurv): string | undefined {
    if (!kurv.forelder?.ident || !kurv.motpart?.ident) return undefined;
    return [kurv.forelder.ident, kurv.motpart.ident].sort().join("-");
}
