import type { RolleType } from "../rolleveileder.ts";

export interface ICreateSakRoller {
    reellMottager?: string | undefined;
    type: RolleType;
    fodselsnummer: string;
}

export interface ICreateSak {
    eierfogd: string;
    roller: ICreateSakRoller[];
}
