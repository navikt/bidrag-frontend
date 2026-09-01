import { fireEvent } from "@testing-library/react";
import { expect } from "chai";

import ModalAssertion from "./ModalAssertion";

export default class NoAccessModalAssertion<T> extends ModalAssertion<T> {
    assertSubmitButtonLabel(expectedValue: string) {
        expect(this.getModal().querySelector(".confirmbutton").textContent).to.be.equal(expectedValue);
        return this;
    }

    clickSubmitButton() {
        fireEvent.click(document.querySelector(".confirmbutton"));
        return this;
    }

    clickCancelButton() {
        fireEvent.click(document.querySelector(".cancelbutton"));
        return this;
    }
}
