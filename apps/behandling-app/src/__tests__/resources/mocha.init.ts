import "cross-fetch/polyfill";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "mocha";
import sinon from "sinon";

// @ts-expect-error

export const sinonSandbox = sinon.createSandbox();
export async function mochaGlobalSetup() {
    // @ts-expect-error
    global.window.showErrorPage = (error) => {
        console.log("showErrorPage was called with error=", error);
    };
    // @ts-expect-error
    global.window.logErrorMessage = (message) => {
        console.log("logErrorMessage was called with message=", message);
    };
    global.window.open = () => null;
    global.window.focus = () => null;
    global.window.close = () => null;

    // @ts-expect-error
    global.window.logToServer = {
        info: (_message: string) => null,
        warning: (_message: string) => null,
        debug: (_message: string) => null,
        error: (_message: string, _err: Error) => null,
    };

    beforeEach(() => {
        cleanup();
    });

    afterEach(() => {
        sinonSandbox.reset();
        sinonSandbox.restore();
        sinonSandbox.resetBehavior();
        sinonSandbox.resetHistory();
    });
}
