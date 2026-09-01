import sinon, { type SinonSandbox } from "sinon";

import SakService from "../../../services/SakService";
import { PERSON_IDENT, sakData } from "../testdata";

export function mockSakService(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    sinonSandbox.stub(SakService.prototype, "hentSakerForPerson").callsFake((personid: string) => {
        return Promise.resolve([sakData(personid)]);
    });

    sinonSandbox.stub(SakService.prototype, "hentSak").callsFake((saksnummer: string) => {
        return Promise.resolve(sakData(PERSON_IDENT, saksnummer));
    });
}
