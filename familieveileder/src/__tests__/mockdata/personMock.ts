import {
    FamileenhetDto,
    FolkeregisteridentifikatorType,
    ForelderrolleType,
    GtType,
    PersonFamilierelasjonerResponse,
    PersonInfoDto,
} from "../../types/personsearch";
import { Rolleveileder } from "../../types/rolleveileder";

export const FODSELSNUMMER = "11111111111";

const personInfoMockData: PersonInfoDto = {
    diskresjonskode: "1",
    geografiskTilknytning: { kode: "1", type: GtType.BYDEL },
    navn: "Navn",
    fornavn: "Navnesen",
    kortnavn: "Kortnavn",
    visningsnavn: "Kortnavn",
    kjonn: "kvinne",
    fodtDato: "01.01.2022",
    isDod: false,
    dodsDato: "",
    isKode6: false,
    isDiskresjon: false,
    bostedsland: "Norge",
    kommunenr: "1",
    ident: "11111",
    isUtgattIdent: false,
    identFormatert: "ident formatert",
    identtype: FolkeregisteridentifikatorType.FNR,
};

/**
 * Lager en person der `navn` også brukes som visningsnavn.
 */
export function createPersonInfo(navn: string, ident: string): PersonInfoDto {
    return { ...personInfoMockData, navn, ident, visningsnavn: navn };
}

/**
 * Lager en familieenhet med gitt motpart og felles barn.
 */
export function createFamilieenheter(
    forelderrolleMotpart: ForelderrolleType,
    motpart: PersonInfoDto | null,
    barn: PersonInfoDto[]
): FamileenhetDto {
    return { forelderrolleMotpart, motpart, fellesBarn: barn };
}

/**
 * BP med to motparter: Mor (22222) med Barn/Barn2 og Mor2 (12345) med Barn3.
 */
export function BPWithTwoMotpart(fodselsnummer: string): PersonFamilierelasjonerResponse {
    const bp = createPersonInfo("Far", fodselsnummer);
    const bm = createPersonInfo("Mor", "22222");
    const bm2 = createPersonInfo("Mor2", "12345");
    return {
        person: bp,
        personensMor: bm,
        personensFar: bp,
        personensFamilieenheter: [
            createFamilieenheter(ForelderrolleType.MOR, bm, [
                createPersonInfo("Barn", "33333"),
                createPersonInfo("Barn2", "44444"),
            ]),
            createFamilieenheter(ForelderrolleType.MOR, bm2, [createPersonInfo("Barn3", "678910")]),
        ],
    };
}

/**
 * Barn med mor (88888) og far (99999).
 */
export function BA(fodselsnummer: string): PersonFamilierelasjonerResponse {
    return {
        person: createPersonInfo("Barn", fodselsnummer),
        personensMor: createPersonInfo("Mor", "88888"),
        personensFar: createPersonInfo("Far", "99999"),
        personensFamilieenheter: [],
    };
}

/**
 * Barn med kun registrert far (99999).
 */
export function BAWithoutPersonensmor(fodselsnummer: string): PersonFamilierelasjonerResponse {
    return { ...BA(fodselsnummer), personensMor: undefined };
}

/**
 * Barn uten registrerte foreldre.
 */
export function BAWithoutForeldre(fodselsnummer: string): PersonFamilierelasjonerResponse {
    return { ...BA(fodselsnummer), personensMor: undefined, personensFar: undefined };
}

/**
 * Lager et {@link Rolleveileder}-objekt.
 */
export function createValgteRoller(bp: string, bm: string, barn: string[]): Rolleveileder {
    return { bp, bm, barn };
}
