import { Kategori, RolleType, type SakDto, SakStatus } from "../../types/api/SakTypes";
import SakResponseBuilder from "../builders/SakBuilder";
import { PERSON_ID_1, PERSON_ID_3, PERSON_ID_4, PERSON_ID_5, PERSON_ID_6 } from "./personMockData";
import type { ResponseData } from "./types";

export const SAKSNUMMER_1 = "2000004";
export const SAKSNUMMER_2 = "2000005";
export const SAKSNUMMER_3 = "2000007";
export const SAKSNUMMER_NO_ACCESS = "2000006";
export const SAKSNUMMER_NO_ACCESS_2 = "2000009";

export const sakMap: Map<string, ResponseData<SakDto>> = new Map([
    [
        SAKSNUMMER_1,
        {
            status: 200,
            data: new SakResponseBuilder.Builder(SAKSNUMMER_1)
                .withEierfogd("4817")
                .withSaksstatus(SakStatus.IN)
                .withKategori(Kategori.N)
                .withParagraf19(false)
                .withBegrensetTilgang(false)
                .withRolle(PERSON_ID_1, RolleType.BM)
                .withRolle(PERSON_ID_4, RolleType.BP)
                .withRolle(PERSON_ID_5, RolleType.BA)
                .build(),
        },
    ],
    [
        SAKSNUMMER_2,
        {
            status: 200,
            data: new SakResponseBuilder.Builder(SAKSNUMMER_2)
                .withEierfogd("4815")
                .withSaksstatus(SakStatus.SO)
                .withKategori(Kategori.N)
                .withParagraf19(false)
                .withBegrensetTilgang(false)
                .withRolle(PERSON_ID_1, RolleType.BM)
                .withRolle(PERSON_ID_4, RolleType.BP)
                .withRolle(PERSON_ID_5, RolleType.BA)
                .withRolle(PERSON_ID_6, RolleType.RM)
                .build(),
        },
    ],
    [
        SAKSNUMMER_3,
        {
            status: 200,
            data: new SakResponseBuilder.Builder(SAKSNUMMER_3)
                .withEierfogd("4815")
                .withSaksstatus(SakStatus.SO)
                .withKategori(Kategori.N)
                .withParagraf19(false)
                .withBegrensetTilgang(false)
                .withRolle(PERSON_ID_5, RolleType.BA)
                .withRolle(PERSON_ID_1, RolleType.BM)
                .withRolle(PERSON_ID_3, RolleType.BP)
                .build(),
        },
    ],
    [
        SAKSNUMMER_NO_ACCESS_2,
        {
            status: 200,
            data: new SakResponseBuilder.Builder(SAKSNUMMER_NO_ACCESS_2)
                .withBegrensetTilgang(true)
                .withParagraf19(false)
                .withEierfogd("4817")
                .withSaksstatus(SakStatus.AK)
                .withKategori(Kategori.N)
                .withRolle(PERSON_ID_1, RolleType.BM)
                .build(),
        },
    ],
    [
        SAKSNUMMER_NO_ACCESS,
        {
            status: 200,
            data: new SakResponseBuilder.Builder(SAKSNUMMER_NO_ACCESS)
                .withBegrensetTilgang(true)
                .withParagraf19(false)
                .withEierfogd("2103")
                .withSaksstatus(SakStatus.AK)
                .withKategori(Kategori.N)
                .withRolle(PERSON_ID_1, RolleType.BM)
                .build(),
        },
    ],
]);
