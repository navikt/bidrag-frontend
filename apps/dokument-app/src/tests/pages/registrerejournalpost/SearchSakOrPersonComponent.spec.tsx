import { fireEvent } from "@testing-library/react";
import { expect } from "chai";
import { describe } from "mocha";
import React from "react";

import SearchSakOrPersonPanel from "../../../pages/registrereJournalpost/components/search/SearchSakOrPersonPanel";
import * as searchActions from "../../../store/recoil/searchState";
import { sinonSandbox } from "../../resources/mocha.init";
import { serviceStubs } from "../../resources/mockservice";
import { PERSON_IDENT, PERSON_NAVN, sakDataWithDiskresjon } from "../../resources/testdata";
import { PersonBuilder } from "../../resources/testdata/PersonData";
import { mountWithStoreAndReactHookForm } from "../../utils/StoreInitializer";
import { removeAttributesFromElement, sleep, waitForEvent } from "../../utils/TestDomUtils";
import RegisterJournalpostEventSimulator from "./RegisterJournalpostEventSimulator";

const stubSearchAction = (response = true) =>
    sinonSandbox
        .stub(searchActions, "startPersonOrSakSearchCallback")
        .returns((searchTerm: string): Promise<boolean> => Promise.resolve(response));
describe("SearchSakOrPersonComponent", () => {
    it("should render", async () => {
        mountWithStoreAndReactHookForm(<SearchSakOrPersonPanel />);
        await waitForEvent(
            () => expect(document.querySelector(".search-sak-person-panel")).to.be.not.null,
            "SearchSakOrPersonComponent should render",
        );
        const searchPanelElement = document.querySelector(".search-sak-person-panel");
        removeAttributesFromElement(searchPanelElement!, "for", "id", "aria-describedby");
        expect(searchPanelElement).to.matchSnapshot();
    });

    it("should search via search button", async () => {
        const searchActionStub = stubSearchAction();
        const saksnummer = "1500000";
        mountWithStoreAndReactHookForm(<SearchSakOrPersonPanel />);
        await waitForEvent(
            () => expect(document.querySelector(".search-sak-person-panel")).to.be.not.null,
            "SearchSakOrPersonComponent should render",
        );
        fireEvent.change(document.querySelector("input"), { target: { value: saksnummer } });
        await sleep(400);
        expect(searchActionStub).to.have.property("callCount", 1);
    });

    it("should show no access warning when no access to sak", async () => {
        const saksnummer = "1500000";
        serviceStubs().hentSakStub.callsFake((personid: string) => {
            return Promise.resolve(sakDataWithDiskresjon(personid, saksnummer));
        });
        mountWithStoreAndReactHookForm(<SearchSakOrPersonPanel />);
        await waitForEvent(
            () => expect(document.querySelector(".search-sak-person-panel")).to.be.not.null,
            "SearchSakOrPersonComponent should render",
        );
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);
        simulator.changeSearchInput(saksnummer);
        await waitForEvent(() => {
            expect(document.querySelector(".no-access-modal") !== null).to.be.true;
        }, "Should render PersonOrSakNoAccessWarning");
    });

    it("should show no access warning when no access to person", async () => {
        serviceStubs().personStub.callsFake((personid: string) => {
            return Promise.resolve(
                new PersonBuilder.Builder(personid).withNavn(PERSON_NAVN).withBegrensetTilgang(true).build(),
            );
        });
        mountWithStoreAndReactHookForm(<SearchSakOrPersonPanel />);
        await waitForEvent(
            () => expect(document.querySelector(".search-sak-person-panel")).to.be.not.null,
            "SearchSakOrPersonComponent should render",
        );
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);
        simulator.changeSearchInput(PERSON_IDENT);
        await waitForEvent(() => {
            expect(document.querySelector(".no-access-modal") !== null).to.be.true;
        }, "Should render PersonOrSakNoAccessWarning");
    });
});

describe("SearchSakOrPersonComponent SearchFailurePanel", () => {
    it("Should show info message when sak not found", async () => {
        stubSearchAction(false);
        await mountWithStoreAndReactHookForm(<SearchSakOrPersonPanel />);
        await sleep(500);
        fireEvent.change(document.querySelector("input"), { target: { value: "1234" } });
        await waitForEvent(
            () => expect(document.querySelector(".search-failure-panel")).to.be.not.null,
            "search failure panel should render",
        );
        expect(document.querySelector(".search-failure-panel")).to.matchSnapshot();
    });

    it("Should show info message when person not found", async () => {
        stubSearchAction(false);
        await mountWithStoreAndReactHookForm(<SearchSakOrPersonPanel />);
        await sleep(500);
        fireEvent.change(document.querySelector("input"), { target: { value: "1234" } });
        await waitForEvent(
            () => expect(document.querySelector(".search-failure-panel")).to.be.not.null,
            "search failure panel should render",
        );
        expect(document.querySelector(".search-failure-panel")).to.matchSnapshot();
    });
});
