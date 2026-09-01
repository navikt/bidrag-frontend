import { fireEvent } from "@testing-library/react";
import { expect } from "chai";
import type { SinonSandbox } from "sinon";

import { serviceStubs } from "../../resources/mockservice";
import { DomSimulator } from "../../utils/DomSimulator";
import NoAccessModalAssertion from "../../utils/NoAccessModalAssertion";
import { SUBMIT_SAK_MODAL_SELECTOR } from "../../utils/SakTableAssertion";

export default class RegisterJournalpostEventSimulator extends DomSimulator {
    constructor(sinonSandbox?: SinonSandbox) {
        super(sinonSandbox);
    }

    noAccessModal() {
        return new NoAccessModalAssertion(this).withModalSelector(".no-access-modal");
    }

    changeMottatDato(date: string): this {
        this.changeInputElement("input#datepicker", date);
        return this;
    }

    async changeSearchInput(value: string, isFnr?: boolean): Promise<this> {
        this.changeInputElement(".search-field input", value);
        if (isFnr) {
            await this.waitForServiceCalled(serviceStubs().personStub, 1);
            await this.waitForServiceCalled(serviceStubs().hentSakerForPersonStub, -1);
        } else {
            await this.waitForServiceCalled(serviceStubs().hentSakStub);
        }
        return this;
    }

    clickSakRadioButton(personId: string, rolleType: string) {
        const element = document
            .querySelector("#selectedSearchedSaksRolleRadioGroup")
            .querySelector(`input#${rolleType + "_" + personId}`);
        fireEvent.click(element);
        return this;
    }
    changeDokumentTittel(value: string, dokumentId?: string): this {
        const dokumenTittelInputElement = dokumentId
            ? document.querySelector(`div#doc_${dokumentId} input`)
            : document.querySelector(".autosuggest-input input");

        fireEvent.change(dokumenTittelInputElement, { target: { value: value } });
        return this;
    }

    changeAvsenderFritekstInput(value: string) {
        fireEvent.change(document.querySelector(`#avsenderMottakerInput`), { target: { value: value } });
        return this;
    }

    clickNySakButton(): this {
        fireEvent.click(document.querySelector("button#ny-sak-knapp"));
        return this;
    }

    clickOpprettSakModalButton() {
        fireEvent.click(document.querySelector(SUBMIT_SAK_MODAL_SELECTOR));
        return this;
    }

    clickOpenAvvikButton(): this {
        fireEvent.click(document.querySelector("button#openAvvikButton"));
        return this;
    }

    clickSakCheckbox(saksnummer: string): this {
        fireEvent.click(document.querySelector(`.sakstilknyttningCheckbox input[value="${saksnummer}"]`));
        return this;
    }

    clickAvsenderSammeSomGjelderCheckbox() {
        fireEvent.click(document.querySelector(`input[name="SAMME_SOM_GJELDER"]`));
        return this;
    }

    clickAvsenderFritekstCheckbox() {
        fireEvent.click(document.querySelector(`input[name="FRITEKST"]`));
        return this;
    }

    clickRegisterJournalpostButton(): this {
        const registrerJpButtonElement = document.querySelector(
            "button#registrere-journalpost-knapp",
        ) as HTMLButtonElement;
        fireEvent.submit(registrerJpButtonElement);
        return this;
    }

    assertAvsenderNotEditable(): this {
        expect(document.querySelector(".avsenderMottakerNotEditable") != null).to.be.true;
        return this;
    }

    assertAvsenderFritekstInput(expectedValue: string): this {
        const avsenderInput = document.querySelector(`#avsenderMottakerInput`) as HTMLInputElement;
        expect(avsenderInput?.value).to.be.equal(expectedValue);
        return this;
    }
    assertSearchInputValue(expectedValue: string): this {
        const searchInput = document.querySelector(".search-field input") as HTMLInputElement;
        expect(searchInput?.value).to.be.equal(expectedValue);
        return this;
    }
}
