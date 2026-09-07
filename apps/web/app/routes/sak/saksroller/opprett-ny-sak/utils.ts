import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import {
    type Barnkurv,
    type BarnMedAlder,
    type ForelderPartRolle,
    MYNDYG_BARN_ALDER,
    type PartISaken,
    type PartRolle,
} from "./opprett-sak-schema";

export function leggTilAlderPåBarn(barn: PersonDto[]): BarnMedAlder[] {
    return barn.map((person) => {
        const alder = person?.fødselsdato ? beregnAlder(person.fødselsdato) : (beregnAlderFraFnr(person.ident) ?? 0);

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
        const sorterteBarn = barnMedAlder.sort((a, b) => b.alder - a.alder); // Yngste først

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

export function erKurvDeaktivert(kurvId: string, aktivKurvId: string | null, harValgteBarn: boolean): boolean {
    if (!harValgteBarn || !aktivKurvId) {
        return false;
    }

    return kurvId !== aktivKurvId;
}

export function tilPartISaken(person: PersonDto, rolle: PartRolle): PartISaken {
    return {
        ident: person.ident,
        navn: person.visningsnavn,
        rolle: rolle,
        diskresjonskode: person.diskresjonskode,
    };
}

export function hentMotsattRolle(rolle: ForelderPartRolle): ForelderPartRolle {
    return rolle === "bidragspliktig" ? "bidragsmottaker" : "bidragspliktig";
}

export function fødselsnummerTilDato(fnr: string): string | null {
    if (fnr?.length !== 11) {
        return null;
    }

    try {
        const dag = fnr.substring(0, 2);
        const måned = fnr.substring(2, 4);
        const år = fnr.substring(4, 6);

        // Bestem århundre basert på individnummer (pos 6-8)
        const individnummer = parseInt(fnr.substring(6, 9), 10);

        let århundre: string;
        if (individnummer >= 0 && individnummer <= 499) {
            århundre = "19";
        } else if (individnummer >= 500 && individnummer <= 749) {
            århundre = "18";
        } else if (individnummer >= 900 && individnummer <= 999) {
            århundre = "19";
        } else {
            århundre = "20";
        }

        const fullÅr = århundre + år;
        return `${dag}/${måned}/${fullÅr}`;
    } catch {
        return null;
    }
}

// Forklaringstekstene er de samme for nye og eksisterende saker.
export { hentDiskresjonskodeForklaring } from "../utils";

const forelderRolleLabels: Record<ForelderPartRolle, string> = {
    bidragspliktig: "Bidragspliktig",
    bidragsmottaker: "Bidragsmottaker",
};

export function hentForelderRolleLabel(rolle: ForelderPartRolle): string {
    return forelderRolleLabels[rolle];
}
