import { waitFor } from "@testing-library/react";
import { expect } from "chai";
import { describe } from "mocha";
import React from "react";

import DistribuerButtons from "../../../pages/visjournalpost/components/distribuer/DistribuerButtons";
import { DokumentType, JournalpostKanal, JournalStatus } from "../../../types/api/JournalpostTypes";
import { sinonSandbox } from "../../resources/mocha.init";
import { serviceStubs } from "../../resources/mockservice";
import {
    AVSENDER_NAVN,
    createPerson,
    DOKUMENT_DATO,
    JOURNAL_DATO,
    JOURNALFORENDE_ENHET,
    JOURNALFORENDE_TITTEL,
    PERSON_IDENT,
} from "../../resources/testdata";
import JournalpostBuilder from "../../resources/testdata/JournalpostData";
import { mountWithStore } from "../../utils/StoreInitializer";
import { removeAttributesFromElement, sleep } from "../../utils/TestDomUtils";
import DistribuerSimulator from "./DistribuerSimulator";

const SAKNR1 = "2000000";
const createJournalpost = (journalpostId: string, journalStatus?: JournalStatus) =>
    new JournalpostBuilder.Builder(journalpostId)
        .withJournalforendeEnhet(JOURNALFORENDE_ENHET)
        .withInnhold(JOURNALFORENDE_TITTEL)
        .withAvsenderNavn(AVSENDER_NAVN)
        .withJournaldato(JOURNAL_DATO)
        .withDokumentdato(DOKUMENT_DATO)
        .withFagomrade("BID")
        .withDokumenttype(DokumentType.U)
        .withJournalstatus(journalStatus ?? JournalStatus.KLAR_TIL_PRINT)
        .withKilde(JournalpostKanal.NAV_NO_BID)
        .withSakstilknytninger([SAKNR1])
        .withGjelderAktor(PERSON_IDENT)
        .withDokumenter([
            {
                dokumentreferanse: "123213",
                tittel: "Tittel",
            },
        ])
        .build();

describe("DistribuerButtons", () => {
    const distribuerSimulator = new DistribuerSimulator();
    beforeEach(() => {
        serviceStubs().personStub.callsFake((ident: string) => {
            return Promise.resolve(createPerson(ident));
        });
        serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
            return Promise.resolve(createJournalpost(jounrlpostId));
        });
    });

    describe("Render DistribuerButtons", () => {
        it("Should not render distribuer buttons when journalpost status is not KP", async () => {
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                return Promise.resolve(createJournalpost("1", JournalStatus.EKSPEDERT));
            });
            mountWithStore(<DistribuerButtons />);
            await sleep(1000);
            expect(document.getElementById("distribuer_buttons") == null).to.be.true;
        });

        it("Should not render start distribuisjon button when kan distribuere returns false", async () => {
            serviceStubs().kanDistribuereJournalpostStub.callsFake(() => Promise.resolve(false));
            mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await sleep(100);
            expect(document.getElementById("start_distribusjon_knapp")).to.be.null;
            expect(document.getElementById("send_manuelt_knapp")).to.be.not.null;
        });

        it("Should render distribuer buttons", async () => {
            mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().hentJournalpostStub));
            waitFor(() => expect(document.getElementById("start_distribusjon_knapp")).to.be.not.null);
            expect(document.getElementById("send_manuelt_knapp")).to.be.not.null;

            const distribuerButtonsElement = document.getElementById("distribuer_buttons");
            removeAttributesFromElement(distribuerButtonsElement, "for", "id", "style");
            expect(distribuerButtonsElement).to.matchSnapshot();
        });
    });
    describe("Send manuelt button", () => {
        it("Should open send manuelt modal", async () => {
            mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().hentJournalpostStub));
            distribuerSimulator.clickSendManueltButton();
            await waitFor(() => distribuerSimulator.getManuelUtsendingModalElement() != null);
            const modal = distribuerSimulator.getManuelUtsendingModalElement();
            expect(modal).to.matchSnapshot();
        });

        it("Should send call distribusjon and redirect to sakshistorikk after confirm", async () => {
            mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().hentJournalpostStub));
            distribuerSimulator.clickSendManueltButton();
            await waitFor(() => distribuerSimulator.getManuelUtsendingModalElement() != null);
            await distribuerSimulator.clickBekreftButton();
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().sakshistorikkRedirectStub));
            sinonSandbox.assert.calledWith(serviceStubs().distribuerJournalpostStub, "BID-100000", "4108");
        });
    });

    describe("Start distribusjon button", () => {
        it("Should open start distribusjon modal", async () => {
            await mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().hentJournalpostStub));
            await waitFor(() => expect(document.querySelector("button#start_distribusjon_knapp")).to.be.not.null);
            distribuerSimulator.clickStartDistribusjonButton();
            await waitFor(() => expect(distribuerSimulator.getBestillDistribusjonModal()).to.be.not.null);
            await sleep(100);
            const modal = distribuerSimulator.getBestillDistribusjonModal();
            expect(modal).to.matchSnapshot();
        });

        it("Should start distribusjon", async () => {
            mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().hentJournalpostStub));
            await waitFor(() => expect(document.querySelector("button#start_distribusjon_knapp")).to.be.not.null);
            distribuerSimulator.clickStartDistribusjonButton();
            await waitFor(() => distribuerSimulator.getBestillDistribusjonModal() != null);
            await distribuerSimulator.clickBekreftButton();
            await sleep(100);
            const expectedAdresse = {
                adresselinje1: "Pepperkakegata 15A",
                land: "NO",
                postnummer: "3000",
                poststed: "Kardemommeby",
            };
            sinonSandbox.assert.calledWith(
                serviceStubs().distribuerJournalpostStub,
                "BID-100000",
                "4108",
                false,
                expectedAdresse,
            );
        });

        it("Should edit adresse", async () => {
            await mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().hentJournalpostStub));
            await waitFor(() => expect(document.querySelector("button#start_distribusjon_knapp")).to.be.not.null);
            distribuerSimulator.clickStartDistribusjonButton();
            await waitFor(() => distribuerSimulator.getBestillDistribusjonModal() != null);
            await waitFor(() => expect(document.querySelector("button#endre_adresse_knapp")).to.be.not.null);
            distribuerSimulator.clickEndreAdresseButton();
            await sleep(100);
            const editAdresseSimulator = new DistribuerSimulator.EndreAdresseSimulator();

            const adresselinje1 = "C/O Nissen";
            const adresselinje2 = "Grangata 15";
            const adresselinje3 = "Etasje 2, høyre dør";
            editAdresseSimulator.changeAdresselinje1(adresselinje1);
            editAdresseSimulator.changeAdresselinje2(adresselinje2);
            editAdresseSimulator.changeAdresselinje3(adresselinje3);
            editAdresseSimulator.changePostnummer("0001");
            editAdresseSimulator.clickLagreAdresseButton();
            await distribuerSimulator.clickBekreftButton();
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().sakshistorikkRedirectStub));
            const expectedAdresse = {
                adresselinje1: adresselinje1,
                adresselinje2: adresselinje2,
                adresselinje3: adresselinje3,
                land: "NO",
                postnummer: "0001",
                poststed: "Oslo",
            };
            sinonSandbox.assert.calledWith(
                serviceStubs().distribuerJournalpostStub,
                "BID-100000",
                "4108",
                false,
                expectedAdresse,
            );
        });
        it("Should edit utenlandsk adresse", async () => {
            mountWithStore(<DistribuerButtons />);
            await waitFor(() => document.getElementById("distribuer_buttons") != null);
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().hentJournalpostStub));
            await waitFor(() => expect(document.querySelector("button#start_distribusjon_knapp")).to.be.not.null);

            distribuerSimulator.clickStartDistribusjonButton();
            await waitFor(() => distribuerSimulator.getBestillDistribusjonModal() != null);
            await waitFor(() => expect(document.querySelector("button#endre_adresse_knapp")).to.be.not.null);
            distribuerSimulator.clickEndreAdresseButton();
            const editAdresseSimulator = new DistribuerSimulator.EndreAdresseSimulator();

            const adresselinje1 = "C/O Nissen";
            const adresselinje2 = "Grangata 15";
            const adresselinje3 = "Etasje 2, høyre dør";
            await sleep(200);
            editAdresseSimulator.selectLand("Sverige");
            await sleep(200);
            editAdresseSimulator.changeAdresselinje1(adresselinje1);
            editAdresseSimulator.changeAdresselinje2(adresselinje2);
            editAdresseSimulator.changeAdresselinje3(adresselinje3);
            editAdresseSimulator.changePoststed("Kalle Anka");
            editAdresseSimulator.clickLagreAdresseButton();
            await distribuerSimulator.clickBekreftButton();
            await waitFor(() => sinonSandbox.assert.called(serviceStubs().sakshistorikkRedirectStub));
            const expectedAdresse = {
                adresselinje1: adresselinje1,
                adresselinje2: adresselinje2,
                adresselinje3: adresselinje3,
                land: "SE",
                postnummer: "",
                poststed: "Kalle Anka",
            };
            sinonSandbox.assert.calledWith(
                serviceStubs().distribuerJournalpostStub,
                "BID-100000",
                "4108",
                false,
                expectedAdresse,
            );
        });
    });
});
