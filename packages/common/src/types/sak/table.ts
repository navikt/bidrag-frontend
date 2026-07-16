import { RelasjonType } from "./personsearch";
import { RolleTypeAbbreviation } from "../roller/RolleType";

export interface IOpprettSakRolleDto {
    fodselsnummer?: string;
    type: RolleTypeAbbreviation | "BA" | "BM" | "BP" | "FR" | "RM";
    rolleType?: RolleTypeAbbreviation | "BA" | "BM" | "BP" | "FR" | "RM";
    reellMottager?: string | null;
}

export interface IOpprettSakRequest {
    eierfogd: string;
    roller: IOpprettSakRolleDto[];
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
