import sinon, { type SinonSandbox } from "sinon";

import JournalpostService from "../../../services/JournalpostService";
import type { RegistrerJournalpostRequest } from "../../../types/api/JournalpostTypes";
import { JournalpostMapper } from "../../../types/journalpost";
import { journalpostDataEnkel } from "../testdata/JournalpostData";

export function mockHentJournalpost(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    sinonSandbox
        .stub(JournalpostService.prototype, "hentJournalpost")
        .callsFake(() => Promise.resolve(new JournalpostMapper(journalpostDataEnkel).map()));
}

export function mockLagreJournalpost(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    return sinonSandbox.stub(JournalpostService.prototype, "lagreJournalpost").resolves();
}

export function mockRegistrereJournalpost(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    return sinonSandbox
        .stub(JournalpostService.prototype, "registrerJournalpost")
        .callsFake((journalpostId: string, paloggetenhet: string, journalpost: RegistrerJournalpostRequest) => {
            return Promise.resolve(journalpost);
        });
}
