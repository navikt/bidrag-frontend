import { expect } from "chai";

import { DomElement } from "./MouseEventUtils";

export default class ModalAssertion<T> {
    modalSelector = "";
    private parent: T;
    constructor(parent?: T) {
        this.parent = parent;
    }

    back() {
        return this.parent;
    }

    withModalSelector(selector: string) {
        this.modalSelector = selector;
        return this;
    }

    getModal() {
        if (document.querySelector(".ReactModalPortal") === null) {
            throw new Error("Could not find modal");
        }
        return document.querySelector(".ReactModalPortal").querySelector(this.modalSelector);
    }

    assertModalExists() {
        expect(this.getModal()).to.be.not.null;
        return this;
    }

    clickButton(buttonSelector: string) {
        new DomElement().withElement(this.getModal()).withChildSelector(buttonSelector).click();
    }

    assertNotLoadingData() {
        expect(this.getModal().querySelector(".spinner")).to.be.null;
    }
}
