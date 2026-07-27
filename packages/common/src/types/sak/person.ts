import { RolleTypeAbbreviation } from "../roller/RolleType";

export interface IPerson {
    ident: string;
    navn: string;
    kortnavn?: string;
    visningsnavn: string;
    fornavn: string;
    mellomnavn: string | null;
    etternavn: string;
    foedselsdato?: string | null;
}

export interface IPersonensReellMottakerRolle extends IPerson {
    checked: boolean;
    error?: string;
    bekreftetOpprettUtenRm?: boolean;
    reellMottaker?: string;
    rolle: RolleTypeAbbreviation;
}
