import { fireEvent } from "@testing-library/react";
import { expect } from "chai";
import type { SinonSandbox, SinonStub } from "sinon";

import { formatDate } from "../../../common/utils/DateUtils";
import NoAccessModalAssertion from "../../utils/NoAccessModalAssertion";
import { SakTableAssertion } from "../../utils/SakTableAssertion";
import { waitForEvent } from "../../utils/TestDomUtils";

export default class VisJournalpostEventSimulator {
    private sinonSandbox: SinonSandbox;

    constructor(sinonSandbox?: SinonSandbox) {
        this.sinonSandbox = sinonSandbox;
    }

    sakTable() {
        return new SakTableAssertion(this);
    }

    noAccessModal() {
        return new NoAccessModalAssertion(this).withModalSelector(".no-access-modal");
    }

    async waitForServiceCalled(stub: SinonStub, callCount = 1) {
        await waitForEvent(
            () => this.sinonSandbox.assert.callCount(stub, callCount),
            `Should call service ${stub.name} ${callCount} times`,
        );
    }

    assertBehandleSakButtonNotExists(saksnummer: string) {
        return new SakTableAssertion(this).assertButtonOnRowNotExists(saksnummer, ".behandle-sak-button").back();
    }

    assertAapneSakButtonExists(sakclickAvsenderGjelderCheckboxsnummer: string) {
        return new SakTableAssertion(this)
            .assertButtonOnRowExists(sakclickAvsenderGjelderCheckboxsnummer, ".aapne-sak-button")
            .back();
    }

    clickAapneSakButton(saksnummer: string) {
        return new SakTableAssertion(this).clickButtonOnRow(saksnummer, ".aapne-sak-button").back();
    }

    changeDokumentDato(date: string): this {
        fireEvent.change(document.querySelector("input#dokumentdato"), { target: { value: date } });
        fireEvent.blur(document.querySelector("input#dokumentdato"));
        return this;
    }

    changeJournalpostTittel(value: string): this {
        const titleInputElement = document.querySelector(".journalpost-title").querySelector("input");
        fireEvent.change(titleInputElement, {
            target: { value: value },
        });
        fireEvent.blur(titleInputElement, { target: { value: value } });
        return this;
    }

    changeDokumentTittel(value: string, dokumentId: string): this {
        const dokumenTittelInputElement = dokumentId
            ? document.querySelector(`div#doc_${dokumentId} input`)
            : document.querySelector(".autosuggest-input input");

        fireEvent.change(dokumenTittelInputElement, { target: { value: value } });
        return this;
    }

    changeReturBeskrivelse(date: string, beskrivelse: string) {
        const loggElement = this.getReturDetaljerLoggByDate(date);
        fireEvent.change(loggElement.querySelector("textarea"), { target: { value: beskrivelse } });
        return this;
    }

    changeReturDato(date: string, changeToDate: string) {
        const loggElement = this.getReturDetaljerLoggByDate(date);
        fireEvent.change(loggElement.querySelector("input"), { target: { value: changeToDate } });
        fireEvent.blur(loggElement.querySelector("input"));
        return this;
    }
    assertDokumentTittelNotEditable(value: string, dokumentId: string) {
        expect(document.querySelector(`div#doc_${dokumentId} input`)).to.be.null;
        return this;
    }

    assertJournalpostTittelNotEditable() {
        expect(document.querySelector(`.journalpost-title input`)).to.be.null;
        return this;
    }

    assertReturDatoNotEditable(date: string) {
        const loggElement = this.getReturDetaljerLoggByDate(date);
        expect(loggElement.querySelector("input")).to.be.null;
        return this;
    }

    assertReturBeskrivelseNotEditable(date: string) {
        const loggElement = this.getReturDetaljerLoggByDate(date);
        expect(loggElement.querySelector("textarea")).to.be.null;
        return this;
    }

    assertDokumentTittelHasValue(value: string, dokumentId: string) {
        const dokumenTittelInputElement: HTMLInputElement = dokumentId
            ? document.querySelector(`div#doc_${dokumentId} input`)
            : document.querySelector(".autosuggest-input input");
        if (dokumenTittelInputElement == null) {
            expect(document.querySelector(`div#doc_${dokumentId} p`).textContent).to.be.contain(value);
        } else {
            expect(dokumenTittelInputElement.value).to.be.equal(value);
        }
        return this;
    }

    assertHasAntallRetur(antall: string) {
        const sistReturDatoElement = document.querySelector("#antallRetur");
        expect(sistReturDatoElement).to.be.not.undefined;
        expect(sistReturDatoElement.innerHTML).to.include(antall);
        return this;
    }

    assertHasReturSistReturDato(dato: string) {
        const sistReturDatoElement = document.querySelector("#sistReturDato");
        expect(sistReturDatoElement).to.be.not.undefined;
        expect(sistReturDatoElement.innerHTML).to.include(formatDate(dato));
        return this;
    }

    assertHasReturDetaljerLogg(dato: string, beskrivelse: string) {
        const returDetaljerLogg = this.getReturDetaljerLoggByDate(dato);
        expect(returDetaljerLogg).to.be.not.undefined;
        expect(returDetaljerLogg.innerHTML).to.include(formatDate(dato));
        expect(returDetaljerLogg.innerHTML).to.include(beskrivelse);
        return this;
    }

    getReturDetaljerLoggByDate(dato: string) {
        const returDetaljerLogg = document.querySelector(".retur-detaljer-logg");
        const returDatoElements = returDetaljerLogg.querySelectorAll(`[class^='returDetaljerLogg']`);
        const it = returDatoElements.values();
        let result = it.next();
        while (!result.done) {
            if (result.value?.innerHTML.includes(formatDate(dato))) {
                return result.value;
            }
            result = it.next();
        }
        return undefined;
    }

    assertDokumentTittelHasValidationError() {
        expect(document.querySelector(".journalpost-title").querySelector(".navds-error-message") !== null).to.be.true;
        return this;
    }

    assertDokumentDatoHasValidationError() {
        expect(document.querySelector("#dokumentdato_container").querySelector(".skjemaelement__feilmelding") !== null)
            .to.be.true;
        return this;
    }

    assertAvsenderInputHasValidationError() {
        expect(document.querySelector("#avsenderMottakerWrapper").querySelector(".skjemaelement__feilmelding") !== null)
            .to.be.true;
        return this;
    }

    changeAvsenderFritekstInput(value: string) {
        fireEvent.change(document.querySelector(`#avsenderMottakerInput`), { target: { value: value } });
        return this;
    }

    clickAvsenderGjelderCheckbox() {
        fireEvent.click(document.querySelector(`input[name="SAMME_SOM_GJELDER"]`));

        return this;
    }

    clickAvsenderFritekstCheckbox() {
        fireEvent.click(document.querySelector(`input[name="FRITEKST"]`));

        return this;
    }

    clickRedigerButton(): this {
        fireEvent.click(document.querySelector("button#redigerButton"));
        return this;
    }

    clickLagreButton(): this {
        fireEvent.click(document.querySelector("button#lagreButton"));
        return this;
    }
}
