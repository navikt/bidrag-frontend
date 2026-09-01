import { expect } from "chai";
import fetchMock from "fetch-mock";
import { beforeEach, describe } from "mocha";

import SakMapper from "../../store/mappers/SakMapper";
import {
    PERSON_ID_5,
    PERSON_ID_6,
    PERSON_ID_7,
    PERSON_ID_8,
    PERSON_ID_9,
    PERSON_ID_10,
    PERSON_ID_11,
    PERSON_ID_12,
} from "../mockdata/personMockData";
import SakBuilder from "../resources/testdata/SakData";

describe("SakService", () => {
    beforeEach(async () => fetchMock.restore());
    it("should find every role in everycase including the given person", () => {
        // GIVEN
        const fnrSoktEtter = PERSON_ID_8;
        const sak2 = new SakBuilder.Builder("2900000")
            .withEierfogd("4806")
            .withRolle(PERSON_ID_9, "BM")
            .withRolle(PERSON_ID_10, "BA")
            .withRolle(fnrSoktEtter, "BP")
            .build();
        const sak1 = new SakBuilder.Builder("1500000")
            .withRolle(fnrSoktEtter, "BM")
            .withRolle(PERSON_ID_11, "BA")
            .withRolle(PERSON_ID_12, "BP")
            .build();

        // WHEN
        const rollerForPerson = SakMapper.findRollerForGittPersonInSaker(fnrSoktEtter, [sak1, sak2]);

        // THEN
        expect(rollerForPerson).to.have.lengthOf(3);
        expect(rollerForPerson[0].foedselsnummer).to.eq(fnrSoktEtter);
    });
    it("should find motsatt roller given another fnr and roller list", () => {
        // GIVEN
        const fnr = PERSON_ID_6;
        const fnrMotpart = PERSON_ID_7;
        const sak = new SakBuilder.Builder("1500000")
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withHovedRolle(PERSON_ID_9, "BM")
            .withKategori("N")
            .withParagraf19(false)
            .withRolle(PERSON_ID_6, "BM")
            .withRolle(PERSON_ID_11, "BA")
            .withRolle(PERSON_ID_7, "BP")
            .build();

        // WHEN
        const rolleForPerson = SakMapper.findMotsattPartInSakForEnkelSak(fnr, sak);

        // THEN
        expect(rolleForPerson).to.be.not.null;
        expect(rolleForPerson.foedselsnummer).to.be.eq(fnrMotpart);
    });
    it("should find motsatt roller given fnr and roller list", () => {
        // GIVEN
        const fnrForBP = PERSON_ID_6;
        const motsattPartFnrSomBM = PERSON_ID_6;
        const sak = new SakBuilder.Builder("1500000")
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withHovedRolle(PERSON_ID_6, "BM")
            .withKategori("N")
            .withParagraf19(false)
            .withRolle(PERSON_ID_5, "BM")
            .withRolle(PERSON_ID_8, "BA")
            .withRolle(PERSON_ID_6, "BP")
            .build();
        // WHEN
        const rolleForPerson = SakMapper.findMotsattPartInSakForEnkelSak(fnrForBP, sak);

        // THEN
        expect(rolleForPerson).to.be.not.null;
        expect(rolleForPerson.foedselsnummer).to.be.eq(motsattPartFnrSomBM);
    });
    it("should find sak given saksnr", () => {
        // GIVEN
        const saksnummer = "0000004";
        const sak = new SakBuilder.Builder(saksnummer)
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withRolle(PERSON_ID_6, "BM")
            .withRolle(PERSON_ID_7, "BA")
            .withRolle(PERSON_ID_8, "BP")
            .build();

        // WHEN
        const sakFunnet = SakMapper.findSakBySaksnummer(saksnummer, [sak]);

        // THEN
        expect(sakFunnet).to.be.not.null;
        expect(sakFunnet.saksnummer).to.be.eq(saksnummer);
    });
    it("should find roller given fnr and roller list", () => {
        // GIVEN
        const fnrForBP = PERSON_ID_6;
        const sak = new SakBuilder.Builder("1500000")
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withRolle(PERSON_ID_10, "BM")
            .withRolle(PERSON_ID_9, "BA")
            .withRolle(PERSON_ID_6, "BP")
            .build();

        // WHEN
        const rolleForPerson = SakMapper.findRolleInRoller(fnrForBP, sak);

        // THEN
        expect(rolleForPerson).to.be.not.null;
        expect(rolleForPerson.foedselsnummer).to.be.eq(fnrForBP);
    });
    it("should find saker given person and saker", () => {
        // GIVEN
        const fnrForBP = PERSON_ID_6;
        const sak = new SakBuilder.Builder("1500000")
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withRolle(PERSON_ID_8, "BM")
            .withRolle(PERSON_ID_9, "BA")
            .withRolle(PERSON_ID_6, "BP")
            .build();

        // WHEN
        const sakerForPerson = SakMapper.findSakerForPerson(fnrForBP, [sak]);

        // THEN
        expect(sakerForPerson).to.be.not.null;
        expect(sakerForPerson).to.have.lengthOf(1);
    });

    it("Should find motsatt part with role BP when  gjelder rolle is BA", () => {
        const sak = new SakBuilder.Builder("1500000")
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withHovedRolle(PERSON_ID_6, "BA")
            .withRolle(PERSON_ID_7, "BM")
            .withRolle(PERSON_ID_8, "BA")
            .withRolle(PERSON_ID_9, "BP")
            .build();

        // WHEN
        const sakWitMotsattRolle = SakMapper.findMotsattPartInSakForEnkelSak("123213213", sak);
        expect(sakWitMotsattRolle.rolleType).to.be.eq("BP");
    });

    it("should find saker and return null", () => {
        const sakerForPerson = SakMapper.findSakerForPerson("", null);
        expect(sakerForPerson).to.be.null;
    });
});
