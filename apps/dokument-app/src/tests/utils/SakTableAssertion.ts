import { fireEvent } from "@testing-library/react";
import { expect } from "chai";

import TableAssertion from "./TableAssertion";

export const NY_SAK_BUTTON_SELECTOR = "#ny-sak-knapp";
export const SUBMIT_SAK_MODAL_SELECTOR = "#opprettsak-submit";
export const CLOSE_SAK_MODAL_SELECTOR = "#opprettsak-close";

export class SakTableAssertion<T> extends TableAssertion {
    private parent: T;
    constructor(parent?: T) {
        super();
        this.parent = parent;
    }

    back() {
        return this.parent;
    }

    getRowWithSaksnummer(saksnummer: string) {
        const elements = Array.from(document.querySelectorAll("tr")).filter(
            (element) => element.querySelector(`input[value="${saksnummer}"]`) !== null,
        );
        return elements.length === 0 ? null : elements[0];
    }

    assertRowWithSaksnummerIsSelected(saksnummer: string) {
        expect(this.getRowWithSaksnummer(saksnummer).classList.contains("tabell__tr--valgt")).to.be.true;
        return this;
    }

    assertRowWithSaksnummerIsNotSelected(saksnummer: string) {
        expect(this.getRowWithSaksnummer(saksnummer).classList.contains("tabell__tr--valgt")).to.be.false;
        return this;
    }

    assertRowWithSaksnummerExists(saksnummer: string) {
        expect(this.getRowWithSaksnummer(saksnummer) !== null).to.be.true;
        return this;
    }

    assertRowWithSaksnummerIsDisabled(saksnummer: string) {
        expect(this.getRowWithSaksnummer(saksnummer).querySelector("input")?.hasAttribute("disabled")).to.be.true;
        return this;
    }

    assertRowWithSaksnummerIsNotDisabled(saksnummer: string) {
        expect(this.getRowWithSaksnummer(saksnummer).querySelector("input")?.hasAttribute("disabled")).to.be.false;
        return this;
    }

    assertOverforSakButtonExists(saksnummer: string) {
        expect(this.getRowWithSaksnummer(saksnummer).querySelector(".overfor-button") !== null).to.be.true;
        return this;
    }

    assertOverforSakButtonNotExists(saksnummer: string) {
        expect(this.getRowWithSaksnummer(saksnummer).querySelector(".overfor-button") === null).to.be.true;
        return this;
    }

    assertButtonOnRowNotExists(saksnummer: string, buttonSelector: string) {
        expect(this.getRowWithSaksnummer(saksnummer).querySelector(buttonSelector) === null).to.be.true;
        return this;
    }

    assertButtonOnRowExists(saksnummer: string, buttonSelector: string) {
        expect(this.getRowWithSaksnummer(saksnummer).querySelector(buttonSelector) !== null).to.be.true;
        return this;
    }

    clickButtonOnRow(saksnummer: string, buttonSelector: string) {
        fireEvent.click(this.getRowWithSaksnummer(saksnummer).querySelector(buttonSelector));
        return this;
    }

    clickOverforSakButton(saksnummer: string) {
        fireEvent.click(this.getRowWithSaksnummer(saksnummer).querySelector(".overfor-button"));
        return this;
    }

    clickNySakButton() {
        fireEvent.click(document.querySelector(NY_SAK_BUTTON_SELECTOR));
        return this;
    }

    clickOpprettSakModalButton() {
        fireEvent.click(document.querySelector(SUBMIT_SAK_MODAL_SELECTOR));
        return this;
    }

    clickSakCheckbox(saksnummer: string) {
        fireEvent.click(document.querySelector(`.sakstilknyttningCheckbox > input[value="${saksnummer}"]`));
        return this;
    }

    assertNySakButtonDisabled() {
        expect(document.querySelector(NY_SAK_BUTTON_SELECTOR).hasAttribute("disabled")).to.be.true;
        return this;
    }
}
