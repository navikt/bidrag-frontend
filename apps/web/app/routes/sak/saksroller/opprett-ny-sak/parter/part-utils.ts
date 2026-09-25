import type { PersonDto } from "@bidrag/api/PersonApi";
import type { ForelderPartRolle, PartISaken, PartRolle } from "../skjema/opprett-sak-schema";

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

const forelderRolleLabels: Record<ForelderPartRolle, string> = {
    bidragspliktig: "Bidragspliktig",
    bidragsmottaker: "Bidragsmottaker",
};

export function hentForelderRolleLabel(rolle: ForelderPartRolle): string {
    return forelderRolleLabels[rolle];
}

export function filtrerBortValgteForeldre(forslag: PersonDto[], valgteForeldre: { ident?: string }[]): PersonDto[] {
    const valgteIdenter = new Set(valgteForeldre.map((forelder) => forelder.ident).filter(Boolean));
    return forslag.filter((forelder) => !valgteIdenter.has(forelder.ident));
}
