import sinon, { type SinonSandbox } from "sinon";

import { RedirectTo } from "../../../common/utils/RedirectUtils";

export function mockRedirectService(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    sinonSandbox.stub(RedirectTo, "oppgaveListe").callsFake(() => {});
    sinonSandbox.stub(RedirectTo, "behandleSak").callsFake(() => {});
    sinonSandbox.stub(RedirectTo, "sakshistorikk").callsFake(() => {});
    return sinonSandbox;
}
