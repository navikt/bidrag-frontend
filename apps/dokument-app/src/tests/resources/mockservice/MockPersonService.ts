import sinon from "sinon";

import PersonService from "../../../services/PersonService";
import { createPerson, createPersonAdresse } from "../testdata";

export function mockPersonService(sinonSandbox = sinon.createSandbox()) {
    sinonSandbox.stub(PersonService.prototype, "getPerson").callsFake((ident: string) => {
        return Promise.resolve(createPerson(ident));
    });
    return sinonSandbox;
}

export function mockPersonGetAdresse(sinonSandbox = sinon.createSandbox()) {
    sinonSandbox.stub(PersonService.prototype, "getPersonAdresse").callsFake((ident: string) => {
        return Promise.resolve(createPersonAdresse());
    });
    return sinonSandbox;
}
