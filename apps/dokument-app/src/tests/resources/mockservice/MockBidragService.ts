import { DefaultRestService } from "@navikt/bidrag-ui-common";
import sinon from "sinon";

import SecuritySessionUtils from "../../../common/utils/SecuritySessionUtils";

export default function mockBidragDokumentService(sinonSandbox = sinon.createSandbox()) {
    sinonSandbox.stub(SecuritySessionUtils, "hentSaksbehandlerId").callsFake(() => {
        return Promise.resolve("Z123123");
    });
    sinonSandbox.stub(DefaultRestService.prototype, "get").callsFake((url: string, config: any) => {
        return Promise.resolve({ ok: true, status: 200, data: null });
    });
    sinonSandbox.stub(DefaultRestService.prototype, "post").callsFake((url: string, config: any) => {
        return Promise.resolve({ ok: true, status: 200, data: null });
    });
    sinonSandbox.stub(DefaultRestService.prototype, "put").callsFake((url: string, config: any) => {
        return Promise.resolve({ ok: true, status: 200, data: null });
    });
    return sinonSandbox;
}
