import "cross-fetch/polyfill";

import { cleanup } from "@testing-library/react";
import { use } from "chai";
import { afterEach, beforeEach } from "mocha";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import sinon from "sinon";

import * as OpprettSakModal from "../../common/components/modal/opprett-sak-modal/OpprettSakModal";
import SecuritySessionUtils from "../../common/utils/SecuritySessionUtils";
import { mockServices } from "./mockservice";
import { OpprettSakMock } from "./mockservice/MockFederatedComponents";
// @ts-expect-error

export const sinonSandbox = sinon.createSandbox();

export async function mochaGlobalSetup() {
    // @ts-expect-error
    global.window.showErrorPage = (error) => {
        console.log("showErrorPage was called with error=", error);
    };
    // @ts-expect-error
    global.window.logErrorMessage = (message, error) => {
        console.log("logErrorMessage was called with message=", message);
    };
    // @ts-expect-error
    global.window.openPersonsok = () => {
        return null;
    };
    global.window.open = () => null;
    global.window.focus = () => null;
    global.window.close = () => null;
    // @ts-expect-error
    global.window.waitForPersonSokResult = () => {
        return Promise.resolve({ ok: true, status: 200, payload: null });
    };
    // @ts-expect-error
    global.window.logToServer = {
        info: (message: string) => null,
        warning: (message: string) => null,
        debug: (message: string) => null,
        error: (message: string, err: Error) => null,
    };
    use(jestSnapshotPlugin());

    beforeEach(() => {
        cleanup();
        mockServices(sinonSandbox);

        sinonSandbox.stub(OpprettSakModal, "default").callsFake(OpprettSakMock);
        sinonSandbox.stub(SecuritySessionUtils, "hentSecuritySessionTokenFromBackend").resolves("");
        sinonSandbox.stub(SecuritySessionUtils, "getSecurityTokenForApp").resolves("");
    });

    afterEach(() => {
        sinonSandbox.reset();
        sinonSandbox.restore();
        sinonSandbox.resetBehavior();
        sinonSandbox.resetHistory();
    });
}
