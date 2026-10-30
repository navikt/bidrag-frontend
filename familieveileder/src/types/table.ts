import { RelasjonType } from "./personsearch";
import { RolleType } from "./rolleveileder";

export interface IFamilierelasjonTableData {
    rolle: RolleType;
    relasjon: RelasjonType;
    fodselsnummer: string;
    navn: string;
    visningsnavn: string;
    isChecked: boolean;
}

export type IBarnRolleTableData = Omit<IFamilierelasjonTableData, "isChecked">;
