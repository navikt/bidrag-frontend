import { IOpprettSakRequest, IOpprettSakRolleDto } from "@bidrag/common";
import { IPersonensReellMottakerRolle } from "@bidrag/common";
import { RolleTypeAbbreviation as RolleType } from "@bidrag/common";
import { getMotpartRolleType } from "./personUtils";

export function createSakPayload(
    eierfogd: string,
    personensId: string,
    personensRolle: RolleType,
    selectedBarn: IPersonensReellMottakerRolle[],
    motpartId?: string
): IOpprettSakRequest {
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
): IOpprettSakRequest {
    const hovedpersonensRolle = {
        fodselsnummer: personensId,
        type: personensRolle as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
        rolleType: personensRolle as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
        reellMottager: motpartReellMottaker,
    };

    const roller: IOpprettSakRolleDto[] = [
        hovedpersonensRolle,
        ...foreldre.map((selected) => ({
            reellMottager: selected.reellMottaker,
            type: selected.rolle as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
            rolleType: selected.rolle as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
            fodselsnummer: selected.ident,
        })),
    ];
    if (foreldre.length === 1) {
        const enesteForeldre = foreldre[0];
        if (enesteForeldre) {
            roller.push({
                rolleType: getMotpartRolleType(enesteForeldre.rolle) as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
                type: getMotpartRolleType(enesteForeldre.rolle) as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
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
): IOpprettSakRolleDto[] {
    const hovedPersonensRolle = {
        fodselsnummer: personensId,
        type: personensRolle as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
    };
    const motpartsRolle = {
        fodselsnummer: motpartId,
        type: getMotpartRolleType(personensRolle) as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
    };

    return [
        hovedPersonensRolle,
        motpartsRolle,
        ...selectedBarn.map((selected) => ({
            reellMottager: selected.reellMottaker,
            type: selected.rolle as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
            rolleType: selected.rolle as unknown as "BA" | "BM" | "BP" | "FR" | "RM",
            fodselsnummer: selected.ident,
        })),
    ];
}
