import type { PersonDto } from "@bidrag/api/PersonApi";
import type { ForelderrolleType } from "./personsearch.ts";
import type { RolleType } from "./rolleveileder.ts";

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

export interface IMotpartBarnRelasjon {
    forelderrolleMotpart: ForelderrolleType;
    motpart: IPerson | null;
    fellesBarn: IPerson[];
}

export interface IForelderBarnRelasjon {
    minRolleForPerson: ForelderrolleType;
    relatertPersonsIdent: string;
    relatertPersonsNavn?: string;
    relatertPersonsRolle: ForelderrolleType;
}

export interface IPersonensReellMottakerRolle extends IPerson {
    checked: boolean;
    error?: string | undefined;
    bekreftetOpprettUtenRm?: boolean;
    reellMottaker?: string | undefined;
    rolle: RolleType;
}

export type ISamhandlerPersonInfo = PersonDto & {
    ident: string;
    navn?: string;
    offentligId?: string;
    isValid: boolean;
};
