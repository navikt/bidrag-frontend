import _ from "lodash";

import type { JournalforendeEnhetDto } from "../../api/BidragOrganisasjonApi";
import type { InternalRolleDto } from "../../types/api/SakTypes";
import type { Person } from "../../types/person";
import type { Sak } from "../../types/sak";

export default class SakMapper {
    static findRolleInRoller(fnr: string, sak: Sak) {
        if (_.isEmpty(fnr) || fnr.trim().length === 0) {
            return;
        }
        return _.find(sak.roller, (r) => r.foedselsnummer === fnr);
    }

    static findMotsattPartInSakForEnkelSak(fnr: string, sak: Sak): InternalRolleDto {
        if (_.isEmpty(fnr) || fnr.trim().length === 0 || _.isEmpty(sak) || !sak.rolle) {
            return;
        }

        let motsattpart = null;
        if (sak.rolle.rolleType === "BP") {
            motsattpart = _.first(_.filter(sak.roller, (rolle) => rolle.rolleType === "BM"));
        } else if (sak.rolle.rolleType === "BM") {
            motsattpart = _.first(_.filter(sak.roller, (rolle) => rolle.rolleType === "BP"));
        } else if (sak.rolle.rolleType === "RM") {
            motsattpart = _.first(_.filter(sak.roller, (rolle) => rolle.rolleType === "RM"));
        } else if (sak.rolle.rolleType === "BA") {
            motsattpart = _.first(_.filter(sak.roller, (rolle) => rolle.rolleType === "BP"));
        }

        if (sak.begrensetTilgang) {
            motsattpart = { ...motsattpart, person: {} };
        }

        return motsattpart;
    }

    static mapSakerForPerson(
        saker: Sak[],
        person: Person,
        enhetsInfo: JournalforendeEnhetDto[],
        saksnummerJournalpost: string[] = [],
    ): Sak[] {
        if (!person) {
            return saker;
        }

        const personIdent = person.ident;
        return _.uniqBy(saker, "saksnummer").map((currentSak) => {
            const updatedSak: Sak = {
                ...currentSak,
                ferdigRegistrert: SakMapper.isFerdigregistrert(currentSak),
                eierfogd: currentSak.eierfogd === "null" ? undefined : currentSak.eierfogd,
                enhetInformasjon: SakMapper.findEnhetsNavn(currentSak.eierfogd, enhetsInfo),
                rolle: SakMapper.findRolleInRoller(personIdent, currentSak),
                tilknyttetJournalpost: saksnummerJournalpost.includes(currentSak.saksnummer),
            };
            updatedSak.motsattRolle = SakMapper.findMotsattPartInSakForEnkelSak(personIdent, updatedSak);
            return updatedSak;
        });
    }

    private static findEnhetsNavn(enhetNr: string, enhetsInfo: JournalforendeEnhetDto[]) {
        const enhet = enhetsInfo.find((enhet) => enhet.enhetIdent === enhetNr);
        return enhet ? enhet.enhetNavn : undefined;
    }

    private static isFerdigregistrert(sak: Sak) {
        return sak.roller.length > 0;
    }

    static findSakerForPerson(fnr: string, saker: Sak[]) {
        if (_.isEmpty(fnr) || fnr.trim().length === 0) {
            return null;
        }
        return _.filter(saker, { roller: [{ foedselsnummer: fnr }] });
    }

    static findRollerForGittPersonInSaker(fnr: string, saker: Sak[]) {
        return _.first(
            saker.filter((sak) => sak.roller.find((el) => el.foedselsnummer === fnr)).map((data) => data.roller),
        );
    }

    static findSakBySaksnummer(saksnummer: string, saker: Sak[]) {
        if (_.isEmpty(saksnummer) || saksnummer.trim().length === 0) {
            return null;
        }
        return _.find(saker, (s) => s.saksnummer === saksnummer);
    }

    static sortBySaksnummer(saker: Sak[]) {
        return saker.sort((a, b) => Number(a.saksnummer) - Number(b.saksnummer));
    }
}
