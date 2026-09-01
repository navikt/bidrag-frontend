import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "chai";

import type { AvvikType } from "../../types/api/AvvikTypes";
import { DomSimulator } from "./DomSimulator";

export default class AvvikModalSimulator extends DomSimulator {
    selectOverforTilEnhet(enhetId: string) {
        const element = document.querySelector('select[name="enhetsnummer"]');
        fireEvent.change(element, {
            target: {
                name: "enhetsnummer",
                value: enhetId,
            },
        });
        return this;
    }

    async clickAvvikButton(avvikType: AvvikType) {
        document
            .getElementById("avvik-" + avvikType)
            .querySelector("a")
            .click();
        await this.waitForLoadingSpinnerFinished();
        return this;
    }

    async selectFagomrade(fagomrade: string) {
        await userEvent.selectOptions(
            document.querySelector(`select[name="fagomrade"]`),
            screen.getByRole("option", { name: fagomrade }),
        );
        return this;
    }

    async clickAvvikConfirmButton() {
        fireEvent.click(document.querySelector(".navds-button.navds-button--primary"));
        await this.waitForLoadingSpinnerFinished();
        return this;
    }

    clickEndreFagomradeToBidragCheckbox() {
        fireEvent.click(screen.getByTestId("endre_fagomrade_til_bidrag"));
        return this;
    }

    clickDokumentCheckbox(dokumentRef: string) {
        fireEvent.click(document.querySelector(`input[id="dokument_${dokumentRef}"]`));
        return this;
    }

    clickConfirmActionCheckbox() {
        fireEvent.click(document.querySelector(`.confirm_action`).querySelector("input"));
        return this;
    }

    clickSakCheckbox(saksnummer: string): this {
        fireEvent.click(document.querySelector(`.sakstilknyttningCheckbox input[value="${saksnummer}"]`));
        return this;
    }

    clickEndreFagomradeBekreftManueltScanningCheckbox() {
        fireEvent.click(document.querySelector(`input[name="bekreftetSendtScanning"]`));
        return this;
    }

    changeReturDetaljerDescription(description: string) {
        const textAreaElement = document.querySelector("textarea");
        fireEvent.change(textAreaElement, { target: { value: description } });
        fireEvent.blur(textAreaElement);
    }

    changeDatepicker(updateDate: string) {
        const datePickerElement = document.querySelector("input#datepicker");
        fireEvent.change(datePickerElement, { target: { value: updateDate } });
        fireEvent.blur(datePickerElement);
    }

    assertHasValidationError(errorMessage: string) {
        const errorElement = document.querySelectorAll(".skjemaelement__feilmelding");
        expect(this.elementHasValue(errorElement, errorMessage)).to.be.true;
    }

    assertHasAvvikWithTitle(expectedTitle: string) {
        const titles = document.getElementsByClassName("typo-systemtittel");
        expect(
            Array.from(titles).some((title) => title.textContent === expectedTitle),
            "AvvikshandteringModal should have module with title " + expectedTitle,
        ).to.be.true;
        return this;
    }

    async waitForLoadingSpinnerFinished() {
        await waitFor(() => document.querySelector(".spinner") == null, { timeout: 1000 });
        return this;
    }
}
