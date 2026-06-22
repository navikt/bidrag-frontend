import { FamileenhetDto } from "../types/personsearch";
import { RolleType, Rolleveileder } from "../types/rolleveileder";
import { IFamilierelasjonTableData } from "../types/table";

export function getFamilierelasjonByRolle(
    personList: IFamilierelasjonTableData[],
    rolle: RolleType
): IFamilierelasjonTableData[] {
    return personList.filter((person) => person.rolle === rolle);
}

export function getFamileenhetByMotpartFodselsnummer(
    personList: FamileenhetDto[],
    fodselsnummer: string
): FamileenhetDto {
    return personList.find((person) => {
        if (person.motpart === undefined || person.motpart === null) {
            return person;
        }
        return person.motpart.ident === fodselsnummer;
    });
}

export function getMotpartRolleType(rolle: RolleType): RolleType {
    return rolle === RolleType.BP ? RolleType.BM : RolleType.BP;
}

export function getRolleType(fodselsnummer: string, valgteRoller: Rolleveileder): RolleType | undefined {
    if (valgteRoller.bp === fodselsnummer) {
        return RolleType.BP;
    }

    if (valgteRoller.bm === fodselsnummer) {
        return RolleType.BM;
    }

    return undefined;
}

/**
 * Beregner alder basert på norsk fødselsnummer.
 * @param fnr Fødselsnummer (11 siffer)
 * @returns Alder i hele år, eller null hvis fnr er ugyldig
 */
export function beregnAlderFraFnr(fnr: string): number | null {
    if (!/^\d{11}$/.test(fnr)) {
        return null;
    }

    const dag = parseInt(fnr.substring(0, 2), 10);
    const måned = parseInt(fnr.substring(2, 4), 10);
    const år = parseInt(fnr.substring(4, 6), 10);
    const individnummer = parseInt(fnr.substring(6, 9), 10);

    const erDnummer = dag > 40;
    const reellDag = erDnummer ? dag - 40 : dag;
    let fødselsår: number;

    // Regler for hvilket århundre (forenklet)
    if (individnummer >= 0 && individnummer <= 499) {
        fødselsår = 1900 + år;
    } else if (individnummer >= 500 && individnummer <= 749 && år >= 54) {
        fødselsår = 1800 + år;
    } else if (individnummer >= 500 && individnummer <= 999 && år <= 39) {
        fødselsår = 2000 + år;
    } else if (individnummer >= 900 && individnummer <= 999 && år >= 40) {
        fødselsår = 1900 + år;
    } else {
        return null;
    }

    const fødselsdato = new Date(fødselsår, måned - 1, reellDag);
    if (isNaN(fødselsdato.getTime())) {
        return null; // ugyldig dato
    }

    const nå = new Date();
    let alder = nå.getFullYear() - fødselsår;

    // Har ikke hatt bursdag enda i år
    if (
        nå.getMonth() < fødselsdato.getMonth() ||
        (nå.getMonth() === fødselsdato.getMonth() && nå.getDate() < fødselsdato.getDate())
    ) {
        alder--;
    }

    return alder;
}

export function beregnAlder(fødselsdato: string): number {
    const idag = new Date();
    const født = new Date(fødselsdato);
    let alder = idag.getFullYear() - født.getFullYear();
    const måned = idag.getMonth() - født.getMonth();
    if (måned < 0 || (måned === 0 && idag.getDate() < født.getDate())) alder--;
    return alder;
}

export function er11Siffer(ident: string) {
    return /^\d{11}$/.test(ident);
}
