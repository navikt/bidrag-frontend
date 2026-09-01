import { expect } from "chai";

import { mapToReqistrerJournalpostRequest } from "../../../pages/registrereJournalpost/components/types/RequestMapper";

describe("[Registrer-bildet] mapToReqistrerJournalpostRequest", () => {
    it("should be created with avsenderNav", () => {
        const avsenderNavn = "Sam Jakobsen";

        const journalpostToRegister = {
            journalpostId: "123",
            tittel: "titel",
            tilknyttSaker: ["1500000", "1500000"],
            endreDokumenter: [],
            journalforendeEnhet: "010119",
            gjelderIdent: "010150",
            avsenderNavn,
        };
        // GIVEN
        const jpDTO = mapToReqistrerJournalpostRequest("04.04.2020", journalpostToRegister);
        expect(jpDTO).to.be.not.null;
        expect(jpDTO.avsenderNavn).to.be.eq(avsenderNavn);
        expect(jpDTO.endreDokumenter).lengthOf(0);
    });
    it("should be created without dokumenter and avsenderNav", () => {
        const journalpostToRegister = {
            journalpostId: "123",
            tittel: "titel",
            tilknyttSaker: ["1500000", "1500000"],
            endreDokumenter: [],
            journalforendeEnhet: "010119",
            gjelderIdent: "010150",
            avsenderNavn: undefined,
        };
        // GIVEN
        const jpDTO = mapToReqistrerJournalpostRequest("04.04.2020", journalpostToRegister);
        expect(jpDTO).to.be.not.null;
        expect(jpDTO.avsenderNavn).to.be.undefined;
        expect(jpDTO.endreDokumenter).lengthOf(0);
    });

    it("should be able to create journalpost to register DTO and remove duplicate saksnummer nn valgt list", () => {
        // GIVEN
        const journalpostToRegister = {
            journalpostId: "123",
            tittel: "titel",
            tilknyttSaker: ["1500000", "1500000"],
            endreDokumenter: [],
            journalforendeEnhet: "010119",
            gjelderIdent: "010150",
            avsenderNavn: "Ole Carlson",
        };
        const jpDTO = mapToReqistrerJournalpostRequest("04.04.2020", journalpostToRegister);

        expect(jpDTO.tilknyttSaker).lengthOf(1);
    });

    it("should map with multiple sak", () => {
        // GIVEN
        const journalpostToRegister = {
            journalpostId: "123",
            tittel: "titel",
            tilknyttSaker: ["1500000", "1500001"],
            endreDokumenter: [],
            journalforendeEnhet: "010119",
            gjelderIdent: "010150",
            avsenderNavn: "Ole Carlson",
        };
        const jpDTO = mapToReqistrerJournalpostRequest("04.04.2020", journalpostToRegister);

        expect(jpDTO.tilknyttSaker).lengthOf(2);
        expect(jpDTO.tilknyttSaker).contain("1500000");
        expect(jpDTO.tilknyttSaker).contain("1500001");
    });
});
