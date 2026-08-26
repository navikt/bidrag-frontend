import type { GebyrDetaljerDto, RolleDto } from "@bidrag/api/BidragBehandlingApiV1";

export enum EndeligIlagtGebyr {
    Ilagt = "ILAGT",
    Fritatt = "FRITATT",
}

export interface GebyrDetaljer extends Omit<GebyrDetaljerDto, "endeligIlagtGebyr"> {
    endeligIlagtGebyr: EndeligIlagtGebyr;
}
export interface GebyrFormRolle {
    rolle: RolleDto;
    gebyrDetaljer: GebyrDetaljer;
}
interface GebyrSak {
    saksnummer: string;
    gebyrRoller: GebyrFormRolle[];
    gebyr18År: GebyrFormRolle[];
}
export interface GebyrFormValues {
    gebyrSaker: GebyrSak[];
}
