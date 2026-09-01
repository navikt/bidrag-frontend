import { Kategori, RolleType, type Sak, SakStatus } from "../../../types/sak";
import { PERSON_ID_6 } from "../../mockdata/personMockData";
import { PERSON_IDENT_2, PERSON_IDENT_3, PERSON_IDENT_4, PERSON_NAVN } from "./index";
import { PersonBuilder } from "./PersonData";

export function createRolle(fnr = PERSON_ID_6, navn?: string, rolleType: RolleType = RolleType.BA) {
    return {
        foedselsnummer: fnr,
        rolleType: rolleType,
        person: new PersonBuilder.Builder(fnr).build(),
    };
}

export const sakData = (fnr: string, saksnummer = "0213705", eierfogd = "4865"): Sak =>
    new SakBuilder.Builder(saksnummer)
        .withEierfogd(eierfogd)
        .withHovedRolle(fnr, RolleType.BA)
        .withParagraf19(false)
        .withRolle(PERSON_IDENT_2, RolleType.RM)
        .withRolle(PERSON_IDENT_4, RolleType.BP)
        .withRolle(PERSON_IDENT_3, RolleType.BM)
        .withKategori(Kategori.U)
        .withSaksstatus(SakStatus.IN)
        .build();

export const sakDataWithDiskresjon = (fnr: string, saksnummer = "0213705"): Sak =>
    new SakBuilder.Builder(saksnummer)
        .withEierfogd("2103")
        .withHovedRolle(fnr, RolleType.BP)
        .withParagraf19(false)
        .withBegrensetTilgang(true)
        .withRolle("", RolleType.BM)
        .withRolle("", RolleType.BA)
        .withKategori(Kategori.N)
        .withSaksstatus(SakStatus.NY)
        .build();

export default class SakBuilder {
    static get Builder() {
        let sak: Sak;

        class Builder {
            constructor(saksnummer) {
                sak = {
                    saksnummer,
                    roller: [],
                    erParagraf19: false,
                    kategori: Kategori.U,
                    saksstatus: SakStatus.IN,
                } as Sak;
            }

            withEierfogd(eierfogd) {
                sak.eierfogd = eierfogd;
                return this;
            }

            withSaksstatus(saksstatus) {
                sak.saksstatus = saksstatus;
                return this;
            }

            withKategori(kategori) {
                sak.kategori = kategori;
                return this;
            }

            withParagraf19(erParagraf19) {
                sak.erParagraf19 = erParagraf19;
                return this;
            }

            withBegrensetTilgang(begrensetTilgang) {
                sak.begrensetTilgang = begrensetTilgang;
                return this;
            }

            withHovedRolle(foedselsnummer, rolleType) {
                sak.rolle = createRolle(foedselsnummer, PERSON_NAVN, rolleType);
                this.withRolle(foedselsnummer, rolleType);
                return this;
            }

            withRolle(foedselsnummer, rolleType) {
                sak.roller.push(createRolle(foedselsnummer, PERSON_NAVN, rolleType));
                return this;
            }

            withMotsattRolle(foedselsnummer, rolleType) {
                sak.motsattRolle = createRolle(foedselsnummer, rolleType);
                return this;
            }

            build() {
                return sak;
            }
        }

        return Builder;
    }
}
