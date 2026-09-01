import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DomSimulator } from "../../utils/DomSimulator";
import { sleep } from "../../utils/TestDomUtils";

export default class DistribuerSimulator extends DomSimulator {
    public clickSendManueltButton() {
        fireEvent.click(document.querySelector("button#send_manuelt_knapp"));
    }

    public clickEndreAdresseButton() {
        fireEvent.click(document.querySelector("button#endre_adresse_knapp"));
    }

    public clickStartDistribusjonButton() {
        fireEvent.click(document.querySelector("button#start_distribusjon_knapp"));
    }

    public async clickBekreftButton() {
        await sleep(100);
        const bekreftKnapp = await screen.findByText("Bekreft og gå tilbake til sakshistorikk");
        fireEvent.click(bekreftKnapp);
    }

    public getManuelUtsendingModalElement() {
        return this.getModal("ManuelUtsendingModal");
    }

    public getBestillDistribusjonModal() {
        return this.getModal("BestillDistribusjonModal");
    }

    static EndreAdresseSimulator = class {
        changeAdresselinje1(value: string) {
            fireEvent.change(this.getInputField("adresselinje1"), { target: { value: value } });
            return this;
        }

        changeAdresselinje2(value: string) {
            fireEvent.change(this.getInputField("adresselinje2"), { target: { value: value } });
            return this;
        }
        changeAdresselinje3(value: string) {
            fireEvent.change(this.getInputField("adresselinje3"), { target: { value: value } });
            return this;
        }

        changePostnummer(value: string) {
            fireEvent.change(this.getInputField("postnummer"), { target: { value: value } });
            return this;
        }

        changePoststed(value: string) {
            fireEvent.change(this.getInputField("poststed"), { target: { value: value } });
            return this;
        }

        selectLand(name: string) {
            userEvent.selectOptions(this.getInputField("land"), screen.getByRole("option", { name: name }));
        }

        public clickLagreAdresseButton() {
            fireEvent.click(document.querySelector("button#lagre_adresse_knapp"));
        }

        public clickForkastLagreAdresseButton() {
            fireEvent.click(document.querySelector("button#forkast_adresse_endringer_knapp"));
        }

        public getInputField(name: string) {
            return document.querySelector(`[name="${name}"]`);
        }
    };
}
