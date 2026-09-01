import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect } from "chai";
import { describe } from "mocha";
import React from "react";
import type { MutableSnapshot } from "recoil";
import type { SinonStub } from "sinon";

import { mapToReqistrerJournalpostRequest } from "../../../pages/registrereJournalpost/components/types/RequestMapper";
import RegistrereJournalpostContainer from "../../../pages/registrereJournalpost/RegistrereJournalpostContainer";
import { AvvikType } from "../../../types/api/AvvikTypes";
import { JOURNALPOST_TITLE_MAX_LENGTH, JournalpostKanal, JournalpostMapper } from "../../../types/journalpost";
import { NY_SAK_SAKSNUMMER } from "../../../types/sak";
import { sinonSandbox } from "../../resources/mocha.init";
import { serviceStubs } from "../../resources/mockservice";
import {
    createPerson,
    JOURNALPOST_ID,
    journalpostDataEnkel,
    NY_OPPRETTET_SAKSNUMMER,
    PALOGGET_ENHET,
    PERSON_IDENT,
    PERSON_IDENT_3,
    PERSON_NAVN,
    sakData,
} from "../../resources/testdata";
import AvvikModalSimulator from "../../utils/AvvikModalSimulator";
import { mountWithStore } from "../../utils/StoreInitializer";
import { sleep, waitForEvent } from "../../utils/TestDomUtils";
import RegisterJournalpostEventSimulator from "./RegisterJournalpostEventSimulator";

// ##### TESTDATA #####
const dokumentDato = "2020-05-05";
const dokumentTittel = "Tttel dokument";
const dokumentId = journalpostDataEnkel.dokumenter[0].dokumentreferanse;

/**
 * Tester som mangler
 * * Avsender bytte mellom gjelder og fritekst
 */
describe("RegistrereJournalpostContainer", () => {
    async function renderRegistrerJournalpostContainer(initializeState?: (mutableSnapshot: MutableSnapshot) => void) {
        mountWithStore(<RegistrereJournalpostContainer />, {
            saksnummer: "",
            initializeState,
        });
        serviceStubs().hentJournalpostStub.resetHistory();
        await waitForEvent(
            () => expect(document.getElementById("registrere-journalpost-container")).to.be.not.null,
            "RegistrereJournalpostContainer should render",
        );
    }

    it("should render", async () => {
        await renderRegistrerJournalpostContainer();
        sinonSandbox.assert.calledTwice(serviceStubs().hentJournalpostStub); //TODO: Kalles to ganger pga at data blir resatt
        expect(document.getElementById("registrere-journalpost-container")).to.not.be.null;
    });

    it.skip("should show error panel when journalpost request fails", async () => {
        serviceStubs().hentJournalpostStub.rejects();
        await renderRegistrerJournalpostContainer();
        await waitForEvent(
            () => expect(document.querySelector(".feilmeldingVeilederPanel")).to.be.not.null,
            "FeilmeldingVeilederPanel should render",
        );
        sinonSandbox.assert.calledOnce(serviceStubs().hentJournalpostStub);
        expect(document.querySelector(".feilmeldingVeilederPanel") !== null).to.not.be.null;
    });

    it("should register journalpost with person search", async () => {
        await renderRegistrerJournalpostContainer();
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);
        serviceStubs().personStub.resetHistory();
        serviceStubs().hentSakerForPersonStub.resetHistory();
        await simulator.changeSearchInput(PERSON_IDENT, true);

        simulator
            .changeMottatDato(dokumentDato)
            .changeDokumentTittel(dokumentTittel, dokumentId)
            .clickNySakButton()
            .clickOpprettSakModalButton()
            .clickRegisterJournalpostButton();
        await validateRegistrerJournalpost(PERSON_NAVN, [NY_OPPRETTET_SAKSNUMMER]);
    }).timeout(5000);

    it("should register journalpost with sak search", async () => {
        const saksnummer = "0102034";
        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve([sakData(personid, saksnummer)]);
        });

        await renderRegistrerJournalpostContainer();
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);

        await simulator.changeSearchInput(saksnummer);
        serviceStubs().hentSakerForPersonStub.resetHistory();
        simulator.clickSakRadioButton(PERSON_IDENT, "BA");
        await simulator.waitForServiceCalled(serviceStubs().hentSakerForPersonStub, 1);

        simulator
            .changeMottatDato(dokumentDato)
            .changeDokumentTittel(dokumentTittel, dokumentId)
            .clickSakCheckbox(saksnummer)
            .clickRegisterJournalpostButton();

        await validateRegistrerJournalpost(PERSON_NAVN, [saksnummer]);
    });

    it("should register journalpost with sak search and avsender fritekst", async () => {
        const saksnummer = "0102034";
        const personNavn = "Batman Batmansen";
        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve([sakData(personid, saksnummer)]);
        });

        await renderRegistrerJournalpostContainer();
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);

        await simulator.changeSearchInput(saksnummer);

        serviceStubs().hentSakerForPersonStub.resetHistory();
        simulator.clickSakRadioButton(PERSON_IDENT_3, "BM");
        await simulator.waitForServiceCalled(serviceStubs().hentSakerForPersonStub, 1);
        simulator.clickAvsenderFritekstCheckbox();
        simulator.changeAvsenderFritekstInput(personNavn);
        simulator
            .changeMottatDato(dokumentDato)
            .changeDokumentTittel(dokumentTittel, dokumentId)
            .clickSakCheckbox(saksnummer)
            .clickRegisterJournalpostButton();

        await validateRegistrerJournalpost(personNavn, [saksnummer], PERSON_IDENT_3);
    });

    it("should not be able to edit avsender on digital innsendt Joark journalpost", async () => {
        const saksnummer = "0102034";
        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve([sakData(personid, saksnummer)]);
        });

        serviceStubs().hentJournalpostStub.callsFake(() => {
            return Promise.resolve(
                new JournalpostMapper({
                    ...journalpostDataEnkel,
                    journalpostId: "JOARK-123213213",
                    kanal: JournalpostKanal.NAV_NO,
                }).map(),
            );
        });

        await renderRegistrerJournalpostContainer();
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);

        await simulator.changeSearchInput(saksnummer);

        serviceStubs().hentSakerForPersonStub.resetHistory();
        simulator.clickSakRadioButton(PERSON_IDENT_3, "BM");
        await simulator.waitForServiceCalled(serviceStubs().hentSakerForPersonStub, 1);
        simulator
            .assertAvsenderNotEditable()
            .changeMottatDato(dokumentDato)
            .changeDokumentTittel(dokumentTittel, dokumentId)
            .clickSakCheckbox(saksnummer)
            .clickRegisterJournalpostButton();

        await validateRegistrerJournalpost(null, [saksnummer], PERSON_IDENT_3);
    });

    it("should register journalpost after switching between avsender fritekst and samme som gjelder ", async () => {
        const saksnummer = "0213705";
        const personNavn = "Batman Batmansen";

        await renderRegistrerJournalpostContainer();
        serviceStubs().personStub.resetHistory();
        serviceStubs().hentSakerForPersonStub.resetHistory();
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);
        await simulator.changeSearchInput(PERSON_IDENT, true);

        simulator.clickAvsenderFritekstCheckbox();
        simulator.changeAvsenderFritekstInput(personNavn);
        simulator.clickAvsenderSammeSomGjelderCheckbox();
        simulator
            .changeMottatDato(dokumentDato)
            .changeDokumentTittel(dokumentTittel, dokumentId)
            .clickSakCheckbox(saksnummer)
            .clickRegisterJournalpostButton();

        await validateRegistrerJournalpost(PERSON_NAVN, [saksnummer]);
    });

    it("should fail on form validation when journalpost title and sak not selected", async () => {
        const saksnummer = "0102034";
        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve({ status: 200, ok: true, data: [sakData(personid, saksnummer)] });
        });
        await renderRegistrerJournalpostContainer();
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);

        await simulator.changeSearchInput(saksnummer);
        serviceStubs().hentSakerForPersonStub.resetHistory();

        simulator.clickSakRadioButton(PERSON_IDENT, "BA");
        await simulator.waitForServiceCalled(serviceStubs().hentSakerForPersonStub, 1);
        simulator.clickRegisterJournalpostButton();
        await sleep(100);
        expect(document.querySelector(".feiloppsummering")).to.matchSnapshot("Feiloppsummering");
    });

    it("should show error message when title is longer than 200 characters", async () => {
        await renderRegistrerJournalpostContainer();

        const simulator = new RegisterJournalpostEventSimulator();
        simulator.changeDokumentTittel("A".repeat(220));
        simulator.clickRegisterJournalpostButton();

        await waitForEvent(() => {
            expect(document.querySelector(".skjemaelement__feilmelding") !== null).to.eq(
                true,
                "Should fail with warning that title is too long",
            );
        });
        expect(document.querySelector(".feiloppsummering").textContent).to.contain(
            `Tittel kan ikke være lengre enn ${JOURNALPOST_TITLE_MAX_LENGTH} tegn`,
        );
    });

    it.skip("Avsender input value should not change when journalpost updated", async () => {
        const avsenderValue = "avsenderValue";
        await renderRegistrerJournalpostContainer();
        const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);

        await simulator.changeSearchInput(PERSON_IDENT);
        simulator
            .clickAvsenderFritekstCheckbox()
            .changeMottatDato(dokumentDato)
            .changeDokumentTittel(dokumentTittel)
            .changeAvsenderFritekstInput(avsenderValue)
            .clickOpenAvvikButton();
        const avvikSimulator = new AvvikModalSimulator();
        avvikSimulator.clickAvvikButton(AvvikType.INNG_TIL_UTG_DOKUMENT);
        avvikSimulator.clickAvvikConfirmButton();
        await simulator.waitForServiceCalled(serviceStubs().hentJournalpostStub, 2);
        simulator.clickNySakButton().clickRegisterJournalpostButton();
        await validateRegistrerJournalpost(avsenderValue);
    });

    describe("AvansertSok", () => {
        const AKTOR_ID = "2762580775882";
        const PERSON_IDENT_AVANSERT_SOK = "1234665656";
        const PERSON_NAVN_AVANSERT_SOK = "Navn Navnesen";
        let openPersonSokStub: SinonStub;
        let waitForPersonSokResultStub: SinonStub;
        beforeEach(() => {
            serviceStubs().personStub.resolves(createPerson());
            openPersonSokStub = sinonSandbox.stub(window, "openPersonsok").returns(null);
            waitForPersonSokResultStub = sinonSandbox.stub(window, "waitForPersonSokResult").resolves({
                ok: true,
                status: 200,
                payload: {
                    ident: PERSON_IDENT_AVANSERT_SOK,
                    navn: PERSON_NAVN_AVANSERT_SOK,
                    aktoerId: AKTOR_ID,
                },
            });
        });
        it("Should update avsenderinput after avansert sok", async () => {
            await renderRegistrerJournalpostContainer((mutableSnapshot) => {
                // mutableSnapshot.set(personState, createPerson());
            });
            const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);
            simulator.clickAvsenderFritekstCheckbox();
            const avansertSokButtons = await screen.findAllByText("Personsøk");
            fireEvent.click(avansertSokButtons[1]);

            await waitFor(() => document.getElementById("avansertsok_modal") !== null);
            await waitFor(() => sinonSandbox.assert.calledOnce(openPersonSokStub));
            await waitFor(() => sinonSandbox.assert.calledOnce(waitForPersonSokResultStub));
            await sleep(100);
            simulator.assertAvsenderFritekstInput(PERSON_NAVN_AVANSERT_SOK);
        });
        it("Should update searchinput after avansert sok", async () => {
            await renderRegistrerJournalpostContainer();
            const simulator = new RegisterJournalpostEventSimulator(sinonSandbox);
            const avansertSokButtons = await screen.findAllByText("Personsøk");
            fireEvent.click(avansertSokButtons[0]);

            await waitFor(() => document.getElementById("avansertsok_modal") !== null);
            await waitFor(() => sinonSandbox.assert.calledOnce(openPersonSokStub));
            await waitFor(() => sinonSandbox.assert.calledOnce(waitForPersonSokResultStub));
            simulator.assertSearchInputValue(PERSON_IDENT_AVANSERT_SOK);
        });
    });
});

async function validateRegistrerJournalpost(
    personNavn: string = PERSON_NAVN,
    tilknyttetSaker: string[] = [NY_SAK_SAKSNUMMER],
    gjelderIdent: string = PERSON_IDENT,
) {
    await waitForEvent(() => {
        sinonSandbox.assert.calledOnce(serviceStubs().behandleSakRedirectStub);
    }, "Should redirect to behandle sak after register journalpost");
    const expectedJournalpostRegisterDto = mapToReqistrerJournalpostRequest(journalpostDataEnkel.journalfortDato, {
        mottatDato: dokumentDato,
        journalforendeEnhet: PALOGGET_ENHET,
        tilknyttSaker: tilknyttetSaker,
        endreDokumenter: [{ dokId: dokumentId, tittel: dokumentTittel }],
        journalpostId: JOURNALPOST_ID,
        gjelderIdent: gjelderIdent,
        avsenderNavn: personNavn,
    });

    sinonSandbox.assert.calledWith(serviceStubs().behandleSakRedirectStub, tilknyttetSaker[0]);
    sinonSandbox.assert.calledWith(serviceStubs().hentJournalpostStub);
    sinonSandbox.assert.calledOnce(serviceStubs().registrerJournalpostStub);
    sinonSandbox.assert.calledWith(
        serviceStubs().registrerJournalpostStub,
        JOURNALPOST_ID,
        PALOGGET_ENHET,
        expectedJournalpostRegisterDto,
    );
}
