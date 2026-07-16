import { Rolletype } from "@bidrag/api/SakApi";
import type * as common from "@bidrag/common";
import { getMotpartRolleType } from "./personUtils";

function toRolletype(rolle: common.RolleTypeAbbreviation): Rolletype {
    return Rolletype[rolle as keyof typeof Rolletype];
}

export function createSakPayload(
    eierfogd: string,
    personensId: string,
    personensRolle: common.RolleTypeAbbreviation,
    selectedBarn: common.IPersonensReellMottakerRolle[],
    motpartId?: string
): common.OpprettSakPayload {
    return {
        eierfogd,
        roller: createSakRoller(personensId, personensRolle, selectedBarn, motpartId),
    };
}

export function createSakPayloadForBA(
    eierfogd: string,
    personensId: string,
    personensRolle: common.RolleTypeAbbreviation,
    foreldre: common.IPersonensReellMottakerRolle[],
    motpartReellMottaker?: string
): common.OpprettSakPayload {
    const hovedpersonensRolle: common.OpprettSakRolleRequest = {
        fodselsnummer: personensId,
        type: toRolletype(personensRolle),
        rolleType: toRolletype(personensRolle),
        reellMottager: motpartReellMottaker,
    };

    const roller: common.OpprettSakRolleRequest[] = [
        hovedpersonensRolle,
        ...foreldre.map((selected): common.OpprettSakRolleRequest => ({
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
    personensRolle: common.RolleTypeAbbreviation,
    selectedBarn: common.IPersonensReellMottakerRolle[],
    motpartId?: string
): common.OpprettSakRolleRequest[] {
    const hovedPersonensRolle: common.OpprettSakRolleRequest = {
        fodselsnummer: personensId,
        type: toRolletype(personensRolle),
    };
    const motpartsRolle: common.OpprettSakRolleRequest = {
        fodselsnummer: motpartId,
        type: toRolletype(getMotpartRolleType(personensRolle)),
    };

    return [
        hovedPersonensRolle,
        motpartsRolle,
        ...selectedBarn.map((selected): common.OpprettSakRolleRequest => ({
            reellMottager: selected.reellMottaker,
            type: toRolletype(selected.rolle),
            rolleType: toRolletype(selected.rolle),
            fodselsnummer: selected.ident,
        })),
    ];
}
