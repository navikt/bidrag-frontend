import sinon, { type SinonSandbox } from "sinon";

import EnhetService from "../../../services/EnhetService";
import type { Enhet } from "../../../types/enhet";
import { enhetInfo, enhetList, enhetListJournalfoerende } from "../testdata/EnhetData";

export function mockPersonGeografiskEnhet(responseBody: Enhet, sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    return sinonSandbox.stub(EnhetService.prototype, "hentPersonGeografiskEnhet").callsFake((personummer: string) => {
        return Promise.resolve(responseBody);
    });
}
export function mockHentEnhetInfo(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    return sinonSandbox.stub(EnhetService.prototype, "hentEnhetInfo").callsFake((personummer: string) => {
        return Promise.resolve(enhetInfo);
    });
}

export function mockHentEnhetList(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    return sinonSandbox.stub(EnhetService.prototype, "hentEnhetlist").callsFake(() => {
        return Promise.resolve(enhetList);
    });
}

export function mockHentJournalforendeEnheter(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    return sinonSandbox.stub(EnhetService.prototype, "hentJournalFoerendeEnheter").callsFake(() => {
        return Promise.resolve(enhetListJournalfoerende);
    });
}
