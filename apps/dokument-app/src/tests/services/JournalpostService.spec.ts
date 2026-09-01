import { DefaultRestService } from "@navikt/bidrag-ui-common";
import { expect } from "chai";
import { describe } from "mocha";
import type { SinonStub } from "sinon";

import JournalpostService from "../../services/JournalpostService";
import PersonService from "../../services/PersonService";
import { sinonSandbox } from "../resources/mocha.init";
import { serviceStubs } from "../resources/mockservice";

describe("JournalpostService", () => {
    const journalpostId = "BID-444444";
    const personIdFNR = "123456";
    const personIdFromJournalpost = "5444444";
    const responsePDL = {
        navn: "Test navn",
        aktoerId: "123213213333",
        ident: personIdFNR,
    };
    it("Journalpost service should return journalpost with FNR", async () => {
        serviceStubs().hentJournalpostStub.restore();

        const getStub = (DefaultRestService.prototype.get as SinonStub).resolves({
            ok: true,
            status: 200,
            data: {
                journalpost: {
                    gjelderAktor: {
                        ident: personIdFromJournalpost,
                        type: "FNR",
                    },
                },
            },
        });
        const personStub = serviceStubs().personStub.resolves(responsePDL);
        const result = await new JournalpostService().hentJournalpost(journalpostId);
        expect(result.gjelderAktor.ident).eq(personIdFromJournalpost);
        expect(result.gjelderAktor.type).eq("FNR");
        sinonSandbox.assert.calledOnce(getStub);
        sinonSandbox.assert.notCalled(personStub);
    });

    it("Journalpost service should convert AKTOERID to FNR", async () => {
        serviceStubs().hentJournalpostStub.restore();

        const getStub = (DefaultRestService.prototype.get as SinonStub).resolves({
            ok: true,
            status: 200,
            data: {
                journalpost: {
                    gjelderAktor: {
                        ident: personIdFromJournalpost,
                        type: "AKTOERID",
                    },
                },
            },
        });
        const personStub = (PersonService.prototype.getPerson as SinonStub).resolves(responsePDL);
        const result = await new JournalpostService().hentJournalpost(journalpostId);
        expect(result.gjelderAktor.ident).eq(personIdFNR);
        expect(result.gjelderAktor.type).eq("FNR");
        sinonSandbox.assert.calledOnce(getStub);
        sinonSandbox.assert.calledOnce(personStub);
    });
});
