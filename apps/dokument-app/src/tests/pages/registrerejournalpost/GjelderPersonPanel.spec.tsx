import { expect } from "chai";
import { describe } from "mocha";
import React from "react";

import GjelderPersonPanel from "../../../pages/registrereJournalpost/components/person/GjelderPersonPanel";
import { RolleType } from "../../../types/sak";
import { serviceStubs } from "../../resources/mockservice";
import { createPerson, PERSON_IDENT_2 } from "../../resources/testdata";
import { mountWithStoreAndReactHookForm } from "../../utils/StoreInitializer";
import { removeAttributesFromElement, sleep, waitForEvent } from "../../utils/TestDomUtils";
import RegisterJournalpostEventSimulator from "./RegisterJournalpostEventSimulator";

const saksnummer = "123213";
describe("GjelderPersonPanel", () => {
    it("Should render gjelder person when only person in state", async () => {
        const personStub = serviceStubs().personStub;
        personStub.resetBehavior();
        personStub.resolves(createPerson());
        mountWithStoreAndReactHookForm(<GjelderPersonPanel />);
        await sleep(100);
        expect(document.querySelector(".gjelder-person-panel")).to.be.not.null;
        expect(document.querySelector(".avsenderMottakerWrapper")).to.be.not.null;
        expect(document.querySelector("#selectedSearchedSaksRolleRadioGroup")).to.be.null;
        const gjelderPersonPanelElement = document.querySelector(".gjelder-person-panel");
        removeAttributesFromElement(gjelderPersonPanelElement, "for", "id", "style");
        expect(gjelderPersonPanelElement).to.matchSnapshot();
    });

    it("Should call hentPerson when tilknyttet sak clicked", async () => {
        const personStub = serviceStubs().personStub;
        personStub.resetBehavior();
        personStub.resolves(createPerson());

        mountWithStoreAndReactHookForm(<GjelderPersonPanel />, {
            initializeState: (mutableSnapshot) => {
                // mutableSnapshot.set(personState, { ident: "", navn: "" });
            },
        });

        await waitForEvent(() => expect(document.querySelector("#selectedSearchedSaksRolleRadioGroup")).to.be.not.null);
        expect(document.querySelector("#selectedSearchedSaksRolleRadioGroup")).to.be.not.null;
        expect(document.querySelector(".gjelder-person-panel")).to.be.not.null;
        expect(document.querySelector(".avsenderMottakerWrapper")).to.be.null;

        const simulator = new RegisterJournalpostEventSimulator();
        simulator.clickSakRadioButton(PERSON_IDENT_2, RolleType.BP);
        expect(personStub.calledOnce).to.be.true;
        expect(personStub.calledWith(PERSON_IDENT_2)).to.be.true;
    });
});
