import type { RelasjonType } from "./personsearch.ts";
import type { RolleType } from "./rolleveileder.ts";

export interface IFamilierelasjonTableData {
    rolle: RolleType;
    relasjon: RelasjonType;
    fodselsnummer: string;
    navn: string;
    visningsnavn: string;
    isChecked: boolean;
}

export type IBarnRolleTableData = Omit<IFamilierelasjonTableData, "isChecked">;
