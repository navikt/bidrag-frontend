import type { PersonResponse } from "../../types/api/PersonTypes";
import PersonBuilder from "../builders/PersonBuilder";
import type { ResponseData } from "./types";

export const PERSON_ID_1 = "17498932282";
export const PERSON_ID_2 = "11516621925";
export const PERSON_ID_3 = "01427247070";
export const PERSON_ID_4 = "31417124171";
export const PERSON_ID_5 = "04458231252";
export const PERSON_ID_6 = "17887114309";
export const PERSON_ID_7 = "99888543000";
export const PERSON_ID_8 = "99888543001";
export const PERSON_ID_9 = "31330797100";
export const PERSON_ID_10 = "25998993995";
export const PERSON_ID_11 = "59118234101";
export const PERSON_ID_12 = "01990791232";
export const PERSON_ID_13 = "25818549944";

export const PERSON_ID_LIMITED_ACCESS = "07318749757";
export const PERSON_ID_LIMITED_ACCESS_2 = "11497705357";
export const personMap: Map<string, ResponseData<PersonResponse>> = new Map([
    [PERSON_ID_2, { status: 200, data: new PersonBuilder.Builder(PERSON_ID_2).withNavn("Hanne Bamsen").build() }],
    [PERSON_ID_3, { status: 200, data: new PersonBuilder.Builder(PERSON_ID_3).withNavn("Kanne Bamsen").build() }],
    [PERSON_ID_1, { status: 200, data: new PersonBuilder.Builder(PERSON_ID_1).withNavn("Sanne Samuel").build() }],
    [PERSON_ID_4, { status: 200, data: new PersonBuilder.Builder(PERSON_ID_4).withNavn("Ranne Kalsen").build() }],
    [PERSON_ID_5, { status: 200, data: new PersonBuilder.Builder(PERSON_ID_5).withNavn("Kalle Ragnesen").build() }],
    [PERSON_ID_6, { status: 200, data: new PersonBuilder.Builder(PERSON_ID_6).withNavn("Anne Bambo").build() }],
    [
        PERSON_ID_LIMITED_ACCESS,
        { status: 403, data: new PersonBuilder.Builder(PERSON_ID_LIMITED_ACCESS).withNavn("Ranne Begrenset").build() },
    ],
    [
        PERSON_ID_LIMITED_ACCESS_2,
        { status: 403, data: new PersonBuilder.Builder(PERSON_ID_LIMITED_ACCESS).withNavn("Hamme Begrenset").build() },
    ],
]);
