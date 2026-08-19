import {PersonDto} from "./PersonTypes";
import {Rolletype} from "@bidrag/api/SakApi";

export type PersonSakerResponse = SakDto[];
export type SakResponse = SakDto;

export interface NySakResponse {
    saksnummer: string;
}

export interface SakDto {
    eierfogd?: string;
    saksnummer: string;
    saksstatus?: SakStatus;
    kategori?: Kategori;
    erParagraf19?: boolean;
    begrensetTilgang?: boolean;
    roller: InternalRolleDto[];
}

export interface InternalRolleDto {
    foedselsnummer?: string;
    rolleType?: Rolletype;
    navn?: string;
    kortnavn?: string;
    visningsnavn?: string;
    person?: PersonDto;
    reellMottaker?: {
        navn?: string;
        ident: string;
        verge: boolean;
    };
}

export interface Sak extends SakDto {
    enhetInformasjon?: string;
    motsattRolle?: InternalRolleDto;
    rolle: InternalRolleDto;
    ferdigRegistrert?: boolean;
    tilknyttetJournalpost?: boolean;
}

export enum Kategori {
    N = "N",
    U = "U",
}

export enum RolleType {
    BA = "BA",
    RM = "RM",
    BM = "BM",
    BP = "BP",
    FR = "FR",
}

export enum SakStatus {
    AK = "AK",
    IN = "IN",
    NY = "NY",
    SA = "SA",
    SO = "SO",
}
