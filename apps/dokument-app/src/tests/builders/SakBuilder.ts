import type { InternalRolleDto, Kategori, RolleType, SakDto, SakStatus } from "../../types/api/SakTypes";

export default class SakResponseBuilder {
    static get Builder() {
        let sak: SakDto;

        class Builder {
            constructor(saksnummer: string) {
                sak = {
                    saksnummer,
                    roller: [] as InternalRolleDto[],
                } as SakDto;
            }
            withEierfogd(eierfogd: string) {
                sak.eierfogd = eierfogd;
                return this;
            }

            withSaksstatus(saksstatus: SakStatus) {
                sak.saksstatus = saksstatus;
                return this;
            }

            withKategori(kategori: Kategori) {
                sak.kategori = kategori;
                return this;
            }
            withParagraf19(erParagraf19: boolean) {
                sak.erParagraf19 = erParagraf19;
                return this;
            }

            withRolle(foedselsnummer: string, rolleType: RolleType) {
                sak.roller!.push({
                    rolleType,
                    foedselsnummer,
                });
                return this;
            }

            withBegrensetTilgang(begrensetTilgang: boolean) {
                sak.begrensetTilgang = begrensetTilgang;
                return this;
            }

            build() {
                return sak;
            }
        }
        return Builder;
    }
}
