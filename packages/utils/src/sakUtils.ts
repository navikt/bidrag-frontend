import type { Rolletype } from "@bidrag/api/SakApi";
import type { OpprettSakPayload, OpprettSakRolleRequest, IPersonensReellMottakerRolle, RolleTypeAbbreviation as RolleType } from "@bidrag/common";
import { getMotpartRolleType } from "./personUtils";

function toRolletype(rolle: RolleType): Rolletype {
    return rolle as unknown as Rolletype;
}

export function createSakPayload(
    eierfogd: string,
    personensId: string,
    personensRolle: RolleType,
    selectedBarn: IPersonensReellMottakerRolle[],
    motpartId?: string
): OpprettSakPayload {
    return {
        eierfogd,
        roller: createSakRoller(personensId, personensRolle, selectedBarn, motpartId),
    };
}

export function createSakPayloadForBA(
    eierfogd: string,
    personensId: string,
    personensRolle: RolleType,
    foreldre: IPersonensReellMottakerRolle[],
    motpartReellMottaker?: string
): OpprettSakPayload {
    const hovedpersonensRolle: OpprettSakRolleRequest = {
        fodselsnummer: personensId,
        type: toRolletype(personensRolle),
        rolleType: toRolletype(personensRolle),
        reellMottager: motpartReellMottaker,
    };

    const roller: OpprettSakRolleRequest[] = [
        hovedpersonensRolle,
        ...foreldre.map((selected): OpprettSakRolleRequest => ({
            reellMottager: selected.reellMottaker,
            type: toRolletype(selected.rolle),
            rolleType: toRolletype(selected.rolle),
            fodselsnummer: selected.ident,
        })),
    ];
    if (foreldre.length === 1) {
        const enesteForeldre = foreldre[0];
        if (enesteForeldre) {
            roller.push({
                rolleType: toRolletype(getMotpartRolleType(enesteForeldre.rolle)),
                type: toRolletype(getMotpartRolleType(enesteForeldre.rolle)),
            });
        }
    }

    return {
        eierfogd,
        roller,
    };
}

function createSakRoller(
    personensId: string,
    personensRolle: RolleType,
    selectedBarn: IPersonensReellMottakerRolle[],
    motpartId?: string
): OpprettSakRolleRequest[] {
    const hovedPersonensRolle: OpprettSakRolleRequest = {
        fodselsnummer: personensId,
        type: toRolletype(personensRolle),
    };
    const motpartsRolle: OpprettSakRolleRequest = {
        fodselsnummer: motpartId,
        type: toRolletype(getMotpartRolleType(personensRolle)),
    };

    return [
        hovedPersonensRolle,
        motpartsRolle,
        ...selectedBarn.map((selected): OpprettSakRolleRequest => ({
            reellMottager: selected.reellMottaker,
            type: toRolletype(selected.rolle),
            rolleType: toRolletype(selected.rolle),
            fodselsnummer: selected.ident,
        })),
    ];
}
