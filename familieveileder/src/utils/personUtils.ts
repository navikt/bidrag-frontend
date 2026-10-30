import { FamileenhetDto } from "../types/personsearch";
import { RolleType, Rolleveileder } from "../types/rolleveileder";
import { IFamilierelasjonTableData } from "../types/table";

/**
 * Filtrerer familierelasjoner på rolle.
 */
export function getFamilierelasjonByRolle(
    personList: IFamilierelasjonTableData[],
    rolle: RolleType
): IFamilierelasjonTableData[] {
    return personList.filter((person) => person.rolle === rolle);
}

/**
 * Finner familieenheten der motparten har gitt fødselsnummer.
 */
export function getFamileenhetByMotpartFodselsnummer(
    personList: FamileenhetDto[],
    fodselsnummer: string
): FamileenhetDto {
    return personList.find((familieenhet) => familieenhet.motpart?.ident === fodselsnummer);
}

/**
 * Finner familieenheten uten registrert motpart.
 */
export function getFamilieenhetUtenMotpart(personList: FamileenhetDto[]): FamileenhetDto | undefined {
    return personList.find((familieenhet) => familieenhet.motpart === undefined || familieenhet.motpart === null);
}

/**
 * Gir motpartens rolle: BM for BP, ellers BP.
 */
export function getMotpartRolleType(rolle: RolleType): RolleType {
    return rolle === RolleType.BP ? RolleType.BM : RolleType.BP;
}

/**
 * Gir rollen (BP/BM) personen allerede er valgt som, eller `undefined`.
 */
export function getRolleType(fodselsnummer: string, valgteRoller: Rolleveileder): RolleType | undefined {
    if (valgteRoller.bp === fodselsnummer) {
        return RolleType.BP;
    }

    if (valgteRoller.bm === fodselsnummer) {
        return RolleType.BM;
    }

    return undefined;
}
