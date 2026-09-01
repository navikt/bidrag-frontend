import { fireEvent } from "@testing-library/react";
import type { SinonSandbox, SinonStub } from "sinon";

import { sinonSandbox } from "../resources/mocha.init";
import { waitForEvent } from "./TestDomUtils";

export class DomSimulator {
    protected sinonSandbox: SinonSandbox;

    constructor(sandbox?: SinonSandbox) {
        this.sinonSandbox = sandbox ?? sinonSandbox;
    }

    async waitForServiceCalled(stub: SinonStub, callCount = 1) {
        const totalCallCount = stub.callCount;
        await waitForEvent(() => {
            if (callCount == -1) {
                return this.sinonSandbox.assert.called(stub);
            }
            return this.sinonSandbox.assert.callCount(stub, callCount);
        }, `Should call service ${stub.name} ${callCount} times but was called ${totalCallCount} times`);
    }

    changeInputElement(selectors: string, newValue: string) {
        fireEvent.change(document.querySelector(selectors), { target: { value: newValue } });
        fireEvent.blur(document.querySelector(selectors));
    }

    elementHasValue(element: NodeList, value: string) {
        const it = element.values();
        let result = it.next();
        while (!result.done) {
            if (result.value?.innerHTML.includes(value)) {
                return true;
            }
            result = it.next();
        }
        return false;
    }

    protected getModal(name: string) {
        return document.querySelector(`div[aria-label='${name}']`);
    }
}
