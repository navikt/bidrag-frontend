import type { Rolletype } from "@bidrag/api/SakApi";
import type { RolleTypeAbbreviation } from "../roller/RolleType";
import type { RelasjonType } from "./personsearch";

/**
 * Subset av RolleDto for oppretting av sak.
 * RolleDto har påkrevde felt (mottagerErVerge, rolleType) med @default-verdiar i API-et,
 * men TypeScript-generatoren markerer dei som required. Vi sender berre dei felta vi faktisk treng.
 */
export interface OpprettSakRolleRequest {
    fodselsnummer?: string;
    type: Rolletype;
    rolleType?: Rolletype;
    reellMottager?: string | null;
}

export interface OpprettSakPayload {
    eierfogd: string;
    roller: OpprettSakRolleRequest[];
}

export interface IFamilierelasjonTableData {
    rolle: RolleTypeAbbreviation;
    relasjon: RelasjonType;
    fodselsnummer: string;
    navn: string;
    visningsnavn: string;
    isChecked: boolean;
}

export type IBarnRolleTableData = Omit<IFamilierelasjonTableData, "isChecked">;
