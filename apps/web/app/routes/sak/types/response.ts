import { ICreateSakRoller } from "./payload/sak";
import { IForelderBarnRelasjon, IMotpartBarnRelasjon, IPerson } from "./person";

export interface IMotpartBarnRelasjonResponse {
    person: IPerson;
    personensMotpartBarnRelasjon: IMotpartBarnRelasjon[];
}

export interface IForelderBarnRelasjonResponse {
    forelderBarnRelasjon: IForelderBarnRelasjon[];
}

export interface IOpprettSakResponse {
    saksnummer: string;
    eierfogd: string;
    ansatt: boolean;
    inhabilitet: boolean;
    levdeAdskilt: boolean;
    paragraf19: boolean;
    konvensjonsdato?: string;
    ffuReferansenr?: string;
    land?: string;
    roller: ICreateSakRoller[];
}
