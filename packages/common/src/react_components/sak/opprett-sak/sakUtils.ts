import { Arbeidsfordeling, type OpprettSakRequest, type RolleDto, type Rolletype } from "@bidrag/api/SakApi";

import type { RolleType } from "./RolleType.ts";
import { getMotpartRolleType } from "./personUtils.ts";
import type { IPersonensReellMottakerRolle } from "./types.ts";

// `OpprettSakRequest`-kontrakten i denne monorepoen krever i tillegg
// kategori/ansatt/inhabilitet/levdeAdskilt/arbeidsfordeling, som ikke fantes
// i den opprinnelige bidrag-ui-modellen (disse feltene ble lagt til i
// bidrag-sak sin kontrakt senere). Modalen samler ikke inn denne
// informasjonen fra saksbehandler i dag, så vi bruker sikre standardverdier
// for en vanlig nasjonal barnebidragssak. Dette bør revurderes hvis
// "Opprett ny sak" skal støtte andre saks-/konvensjonstyper.
const STANDARDVERDIER: Pick<
    OpprettSakRequest,
    "kategori" | "ansatt" | "inhabilitet" | "levdeAdskilt" | "arbeidsfordeling"
> = {
    kategori: "N",
    ansatt: false,
    inhabilitet: false,
    levdeAdskilt: false,
    arbeidsfordeling: Arbeidsfordeling.BBF,
};

function tilRolleDto(fodselsnummer: string | undefined, rolle: RolleType, reellMottaker?: string): RolleDto {
    return {
        fodselsnummer,
        type: rolle as unknown as Rolletype,
        rolleType: rolle as unknown as Rolletype,
        reellMottager: reellMottaker,
        mottagerErVerge: false,
        rollehistorikk: [],
    };
}

export function createSakPayload(
    eierfogd: string,
    personensId: string,
    personensRolle: RolleType,
    selectedBarn: IPersonensReellMottakerRolle[],
    motpartId?: string,
): OpprettSakRequest {
    return {
        ...STANDARDVERDIER,
        eierfogd,
        roller: [
            tilRolleDto(personensId, personensRolle),
            tilRolleDto(motpartId, getMotpartRolleType(personensRolle)),
            ...selectedBarn.map((barn) => tilRolleDto(barn.ident, barn.rolle, barn.reellMottaker)),
        ],
    };
}

export function createSakPayloadForBA(
    eierfogd: string,
    personensId: string,
    personensRolle: RolleType,
    foreldre: IPersonensReellMottakerRolle[],
    motpartReellMottaker?: string,
): OpprettSakRequest {
    const roller = [
        tilRolleDto(personensId, personensRolle, motpartReellMottaker),
        ...foreldre.map((selected) => tilRolleDto(selected.ident, selected.rolle, selected.reellMottaker)),
    ];

    const eneForelder = foreldre.length === 1 ? foreldre[0] : undefined;
    if (eneForelder) {
        roller.push(tilRolleDto(undefined, getMotpartRolleType(eneForelder.rolle)));
    }

    return {
        ...STANDARDVERDIER,
        eierfogd,
        roller,
    };
}
