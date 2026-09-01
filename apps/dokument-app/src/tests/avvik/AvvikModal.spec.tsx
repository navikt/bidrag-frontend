import { Broadcast, type BroadcastMessage, type EditDocumentBroadcastMessage } from "@navikt/bidrag-ui-common";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect } from "chai";
import React from "react";

import AvvikshandteringModal from "../../common/components/avvik/components/AvvikshandteringModal";
import {
    BestillOriginalViewModel,
    BestillReskanningViewModel,
    BestillSplittingViewModel,
    EndreFagomradeViewModel,
    FeilforeSakViewModel,
    InngTilUtgDokumentViewModel,
    OverforTilAnnenEnhetViewModel,
    RegistrerReturViewModel,
    SlettJournalpostViewModel,
    TrekkJournalpostViewModel,
} from "../../common/components/avvik/model/AvvikViewModel";
import { AvvikType } from "../../types/api/AvvikTypes";
import { DokumentType, type JournalpostDto, LagreJournalpostRequest } from "../../types/api/JournalpostTypes";
import type { Avvik } from "../../types/avvik";
import { BidragEnhet } from "../../types/enhet";
import { JournalpostMapper, JournalStatus } from "../../types/journalpost";
import { JOURNALPOST_ID_TEST, JOURNALPOST_TEST_ENHET } from "../mockdata/journalpostMockData";
import { PERSON_ID_1 } from "../mockdata/personMockData";
import DistribuerSimulator from "../pages/visjournalpost/DistribuerSimulator";
import { sinonSandbox } from "../resources/mocha.init";
import { serviceStubs } from "../resources/mockservice";
import { JOURNALPOST_ID, journalpostDataEnkel, PALOGGET_ENHET, sakData } from "../resources/testdata";
import AvvikModalSimulator from "../utils/AvvikModalSimulator";
import { type InitialState, mountWithStore } from "../utils/StoreInitializer";
import { removeAttributesFromElement, sleep } from "../utils/TestDomUtils";

const journalpostDto: JournalpostDto = {
    avsenderNavn: "string",
    dokumenter: [
        {
            tittel: "Dokumentittel",
            dokumentreferanse: "213123133",
        },
        {
            tittel: "Vedlegg 1",
            dokumentreferanse: "123213123",
        },
    ],
    fagomrade: "BID",
    journalforendeEnhet: JOURNALPOST_TEST_ENHET,
    journalfortDato: "2020-01-01",
    gjelderAktor: {
        ident: PERSON_ID_1,
        type: "FNR",
    },
    journalpostId: JOURNALPOST_ID,
    journalstatus: JournalStatus.MOTTAT,
    dokumentType: DokumentType.I,
};

describe("AvvikModal", () => {
    beforeEach(() => {
        serviceStubs().lagreJournalpostStub.resolves();
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(new JournalpostMapper(journalpostDto).map()),
        );
        serviceStubs().sendAvvikStub.resolves({ ok: true, status: 200, data: "" });
    });

    const renderAvvikModal = async (initialState?: Partial<InitialState>, paloggetEnhet = PALOGGET_ENHET) => {
        mountWithStore(<AvvikshandteringModal closeModal={() => null} paloggetEnhet={paloggetEnhet} />, {
            ...initialState,
            paloggetEnhet: paloggetEnhet,
        });
        serviceStubs().hentJournalpostStub.resetHistory();
        await sleep(500);
    };

    it(`AvvikModal should render with avvik buttons`, async () => {
        await renderAvvikModal();
        expect(document.getElementsByClassName("AvvikshandteringModal").item(0)).to.matchSnapshot("TEST");
        const avvikSimulator = new AvvikModalSimulator();
        avvikSimulator.assertHasAvvikWithTitle(new BestillReskanningViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new BestillOriginalViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new BestillSplittingViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new InngTilUtgDokumentViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new SlettJournalpostViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new FeilforeSakViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new EndreFagomradeViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new TrekkJournalpostViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new OverforTilAnnenEnhetViewModel().title);
        avvikSimulator.assertHasAvvikWithTitle(new RegistrerReturViewModel().title);
    });

    it(`Should perform feilfor and show sakshistorikk link`, async () => {
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.FEILFORE_SAK);
        await avvikSimulator.clickAvvikConfirmButton();

        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("Feilfor sak after confirm");
        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
    });

    it(`Should perform ENDRE_FAGOMRADE avvik to farskap and overføre enhet to pålogget enhet`, async () => {
        const jfrEnhet = "2101";
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(new JournalpostMapper({ ...journalpostDto, journalforendeEnhet: jfrEnhet }).map()),
        );
        await renderAvvikModal(
            {
                pageType: PageType.VIS_JOURNALPOST,
                // // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
            },
            BidragEnhet.UTLAND,
        );
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);
        await avvikSimulator.selectFagomrade("Farskap");
        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: "FAR",
            bekreftetSendtScanning: false,
        };
        const expectedAvvikOverførEnhet: Avvik = {
            type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
            nyttEnhetsnummer: BidragEnhet.UTLAND,
            gammeltEnhetsnummer: jfrEnhet,
        };
        expect(serviceStubs().sendAvvikStub.calledTwice).to.be.true;
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvikOverførEnhet,
            JOURNALPOST_ID,
            BidragEnhet.UTLAND,
            undefined,
        );
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            BidragEnhet.UTLAND,
            undefined,
        );
    });

    it(`Should perform ENDRE_FAGOMRADE to farskap and not overføre enhet`, async () => {
        const paloggetEnhet = BidragEnhet.FARSKAP;
        const jfrEnhet = paloggetEnhet;
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(new JournalpostMapper({ ...journalpostDto, journalforendeEnhet: jfrEnhet }).map()),
        );
        await renderAvvikModal(
            {
                pageType: PageType.VIS_JOURNALPOST,
                // // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
            },
            paloggetEnhet,
        );
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);
        await avvikSimulator.selectFagomrade("Farskap");
        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: "FAR",
            bekreftetSendtScanning: false,
        };
        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            paloggetEnhet,
            undefined,
        );
    });

    it(`Should perform ENDRE_FAGOMRADE avvik and overføre enhet to farskap`, async () => {
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);
        await avvikSimulator.selectFagomrade("Farskap");
        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: "FAR",
            bekreftetSendtScanning: false,
        };
        const expectedAvvikOverførEnhet: Avvik = {
            type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
            nyttEnhetsnummer: "4860",
            gammeltEnhetsnummer: PALOGGET_ENHET,
        };
        expect(serviceStubs().sendAvvikStub.calledTwice).to.be.true;
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvikOverførEnhet,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform ENDRE_FAGOMRADE avvik`, async () => {
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);
        await avvikSimulator.selectFagomrade("Dagpenger");
        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);
        await avvikSimulator.clickEndreFagomradeBekreftManueltScanningCheckbox();
        await avvikSimulator.clickAvvikConfirmButton();
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: "ENDRE_FAGOMRADE",
            fagomrade: "DAG",
            bekreftetSendtScanning: true,
        };
        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform ENDRE_FAGOMRADE avvik on joark journalpost to farskap and overføre enhet to pålogget enhet`, async () => {
        const jfrEnhet = "2101";
        const paloggetEnhet = BidragEnhet.UTLAND;
        const journalpostId = "JOARK-123123213";
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(
                new JournalpostMapper({ ...journalpostDto, journalforendeEnhet: jfrEnhet, journalpostId }).map(),
            ),
        );
        await renderAvvikModal(
            {
                pageType: PageType.VIS_JOURNALPOST,
                // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
            },
            paloggetEnhet,
        );
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);
        await avvikSimulator.selectFagomrade("Farskap");
        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: "FAR",
        };
        const expectedAvvikOverførEnhet: Avvik = {
            type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
            nyttEnhetsnummer: paloggetEnhet,
            gammeltEnhetsnummer: jfrEnhet,
        };
        expect(serviceStubs().sendAvvikStub.calledTwice).to.be.true;
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvikOverførEnhet,
            journalpostId,
            paloggetEnhet,
            undefined,
        );
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            journalpostId,
            paloggetEnhet,
            undefined,
        );
    });

    it(`Should perform ENDRE_FAGOMRADE on joark journalpost to farskap and not overføre enhet`, async () => {
        const paloggetEnhet = BidragEnhet.FARSKAP;
        const jfrEnhet = paloggetEnhet;
        const journalpostId = "JOARK-123123213";
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(
                new JournalpostMapper({ ...journalpostDto, journalpostId, journalforendeEnhet: jfrEnhet }).map(),
            ),
        );
        await renderAvvikModal(
            {
                pageType: PageType.VIS_JOURNALPOST,
                // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
            },
            paloggetEnhet,
        );
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);
        await avvikSimulator.selectFagomrade("Farskap");
        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: "FAR",
        };
        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            journalpostId,
            paloggetEnhet,
            undefined,
        );
    });

    it(`Should perform ENDRE_FAGOMRADE avvik for joark journalpost overføre enhet to farskap`, async () => {
        const journalpostId = "JOARK-123123213";
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(
                new JournalpostMapper({
                    ...journalpostDto,
                    journalpostId,
                }).map(),
            ),
        );
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);

        expect(avvikModalElement.querySelector(".endrefagomrade_joark")).is.not.null;
        await avvikSimulator.selectFagomrade("Farskap");
        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(200);
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: "FAR",
        };
        const expectedAvvikOverførEnhet: Avvik = {
            type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
            nyttEnhetsnummer: "4860",
            gammeltEnhetsnummer: PALOGGET_ENHET,
        };
        expect(serviceStubs().sendAvvikStub.calledTwice).to.be.true;
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvikOverførEnhet,
            journalpostId,
            PALOGGET_ENHET,
            undefined,
        );
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            journalpostId,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform ENDRE_FAGOMRADE avvik for joark journalpost`, async () => {
        const journalpostId = "JOARK-123123213";
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(
                new JournalpostMapper({
                    ...journalpostDto,
                    journalpostId,
                }).map(),
            ),
        );
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.ENDRE_FAGOMRADE);
        await sleep(100);

        expect(avvikModalElement.querySelector(".endrefagomrade_joark")).is.not.null;
        await avvikSimulator.selectFagomrade("Forsikring");
        await avvikSimulator.clickAvvikConfirmButton();
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("After ENDRE_FAGOMRADE");
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: "ENDRE_FAGOMRADE",
            fagomrade: "FOS",
        };
        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            journalpostId,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform SEND_KOPI_TIL_FAGOMRADE avvik`, async () => {
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.SEND_TIL_FAGOMRADE);
        await avvikSimulator.selectFagomrade("Barnetrygd");
        await avvikSimulator.clickDokumentCheckbox("alle");
        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("Before SEND_KOPI_TIL_FAGOMRADE");

        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);
        await avvikSimulator.clickConfirmActionCheckbox();
        await avvikSimulator.clickAvvikConfirmButton();

        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: "SEND_TIL_FAGOMRADE",
            fagomrade: "BAR",
            dokumenter: "BID-100000:213123133,BID-100000:123213123",
        };
        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform REGISTRER_RETUR avvik`, async () => {
        const beskrivelse = "Dette er beskrivelse";
        const dato = "9999-01-01";
        await renderAvvikModal({
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.REGISTRER_RETUR);

        avvikSimulator.changeDatepicker(dato);
        avvikSimulator.changeReturDetaljerDescription(beskrivelse);

        removeAttributesFromElement(avvikModalElement, "for", "id", "style", "aria-describedby");
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet view");

        await avvikSimulator.clickAvvikConfirmButton();
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet after confirm");
        await sleep(100);

        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: "REGISTRER_RETUR",
            beskrivelse: beskrivelse,
            returDato: dato,
        };
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should not allow to perform REGISTRER_RETUR avvik with existing retur dato`, async () => {
        const journalpostWithReturDetaljer = {
            ...journalpostDataEnkel,
            returDetaljer: {
                antall: 1,
                dato: "2020-01-01",
                logg: [
                    {
                        dato: "2020-01-01",
                        beskrivelse: "testtest",
                    },
                ],
            },
        };
        serviceStubs().hentJournalpostStub.callsFake(() => {
            return Promise.resolve(new JournalpostMapper(journalpostWithReturDetaljer).map());
        });

        const beskrivelse = "Dette er beskrivelse";
        const dato = "2020-01-01";
        await renderAvvikModal({
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.REGISTRER_RETUR);

        avvikSimulator.changeDatepicker(dato);
        avvikSimulator.changeReturDetaljerDescription(beskrivelse);

        removeAttributesFromElement(avvikModalElement, "for", "id", "style", "aria-describedby");
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet view");

        await avvikSimulator.clickAvvikConfirmButton();
        await sleep(100);

        avvikSimulator.assertHasValidationError("Ugyldig dato. Kan ikke registrere retur på eksisterende returdato");
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet after confirm");

        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.false;
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
    });

    it(`Should perform overfor til annen enhet avvik when person not exists`, async () => {
        await renderAvvikModal({
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.OVERFOR_TIL_ANNEN_ENHET);
        await sleep(100);

        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet view");
        await sleep(100);

        await avvikSimulator.clickAvvikConfirmButton();
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet after confirm");
        await sleep(100);

        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
    });

    it(`Should perform overfor til annen enhet avvik and endre fagomrade to Bidrag when journalpost has fagområde Farskap`, async () => {
        const journalpostId = "JOARK-123123213";
        const selectEnhetsnummer = "4806";
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(
                new JournalpostMapper({
                    ...journalpostDto,
                    fagomrade: "FAR",
                    journalpostId,
                }).map(),
            ),
        );
        await renderAvvikModal({
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.OVERFOR_TIL_ANNEN_ENHET);
        await sleep(100);

        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet with farskap");
        await sleep(100);
        avvikSimulator.selectOverforTilEnhet(selectEnhetsnummer);

        await avvikSimulator.clickEndreFagomradeToBidragCheckbox();
        await avvikSimulator.clickAvvikConfirmButton();
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet after confirm");
        await sleep(100);

        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;

        expect(serviceStubs().sendAvvikStub.calledTwice).to.be.true;
        const expectedAvvik = {
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: "BID",
        };
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            journalpostId,
            PALOGGET_ENHET,
            undefined,
        );
        sinonSandbox.assert.calledWithExactly(
            serviceStubs().sendAvvikStub,
            {
                type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
                nyttEnhetsnummer: selectEnhetsnummer,
                gammeltEnhetsnummer: JOURNALPOST_TEST_ENHET,
            },
            journalpostId,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform overfor til annen enhet and lagre journalpost when person exists`, async () => {
        const selectEnhetsnummer = "4806";
        await renderAvvikModal({
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, createPerson(PERSON_ID_1)),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.OVERFOR_TIL_ANNEN_ENHET);
        avvikSimulator.selectOverforTilEnhet(selectEnhetsnummer);

        removeAttributesFromElement(avvikModalElement, "for", "id");
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet view");

        await avvikSimulator.clickAvvikConfirmButton();
        expect(avvikModalElement).to.matchSnapshot("Overfor til annen enhet after confirm");

        const expectedLagreJournalpost = new LagreJournalpostRequest(JOURNALPOST_ID);
        expectedLagreJournalpost.gjelder = PERSON_ID_1;

        const expectedAvvik = {
            type: "OVERFOR_TIL_ANNEN_ENHET",
            nyttEnhetsnummer: selectEnhetsnummer,
            gammeltEnhetsnummer: JOURNALPOST_TEST_ENHET,
        };

        await sleep(100);

        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.true;
        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );

        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().lagreJournalpostStub,
            JOURNALPOST_ID_TEST,
            selectEnhetsnummer,
            expectedLagreJournalpost,
        );
        sinonSandbox.assert.calledOnce(serviceStubs().hentJournalpostStub);
    });

    it(`Should perform BESTILL_NY_DISTRIBUSJON avvik with changed adresse`, async () => {
        const journalpostWithReturDetaljer = {
            ...journalpostDto,
            returDetaljer: {
                antall: 1,
                dato: "2020-01-01",
                logg: [
                    {
                        dato: "2020-01-01",
                        beskrivelse: "testtest",
                    },
                ],
            },
        };
        serviceStubs().hentJournalpostStub.callsFake(() => {
            return Promise.resolve(new JournalpostMapper(journalpostWithReturDetaljer).map());
        });
        await renderAvvikModal({
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.BESTILL_NY_DISTRIBUSJON);
        await sleep(100);

        new DistribuerSimulator().clickEndreAdresseButton();

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
        await sleep(100);

        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("Bestill ny distribusjon view");

        await avvikSimulator.clickAvvikConfirmButton();
        expect(avvikModalElement).to.matchSnapshot("Bestill ny distribusjon view after confirm");

        expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true;
        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;

        const expectedAvvik = {
            type: "BESTILL_NY_DISTRIBUSJON",
            adresse: {
                adresselinje1: adresselinje1,
                adresselinje2: adresselinje2,
                adresselinje3: adresselinje3,
                land: "NO",
                postnummer: "0001",
                poststed: "Oslo",
            },
        };
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform KOPIER_FRA_ANNEN_FAGOMRADE avvik`, async () => {
        const saksnummer1 = "12312312";
        const saksnummer2 = "55312312";
        const journalpostFraAnnenFagomrade = {
            ...journalpostDto,
            fagomrade: "BAR",
            journalstatus: JournalStatus.JOURNALFOERT,
        };

        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve([sakData(personid, saksnummer1), sakData(personid, saksnummer2)]);
        });
        serviceStubs().hentJournalpostStub.callsFake(() => {
            return Promise.resolve(new JournalpostMapper(journalpostFraAnnenFagomrade).map());
        });
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "123213123" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE);

        // Velg dokumenter
        await avvikSimulator.clickDokumentCheckbox("alle");
        await avvikSimulator.clickAvvikConfirmButton();

        // Se gjennom og rediger
        await sleep(100);

        await avvikSimulator.clickConfirmActionCheckbox();
        await avvikSimulator.clickAvvikConfirmButton();

        await sleep(100);

        // Velg sak
        await avvikSimulator.clickSakCheckbox(saksnummer1);
        await avvikSimulator.clickAvvikConfirmButton();

        await sleep(100);

        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("KOPIER_FRA_ANNEN_FAGOMRADE sammendrag av endringer");

        await avvikSimulator.clickAvvikConfirmButton();

        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: "KOPIER_FRA_ANNEN_FAGOMRADE",
            relevanteDokumenter: [
                {
                    tittel: "Dokumentittel",
                    dokumentreferanse: "213123133",
                    tittelDisplayValue: "Dokumentittel",
                    dokumentLabel: "Dokumentittel (213123133)",
                    dokumentLabelShort: "Dokumentittel (213123133)",
                    isHoveddokument: true,
                    dokumentOrder: 0,
                },
                {
                    tittel: "Vedlegg 1",
                    dokumentreferanse: "123213123",
                    tittelDisplayValue: "Vedlegg 1",
                    dokumentLabel: "Vedlegg 1 (123213123)",
                    dokumentLabelShort: "Vedlegg 1 (123213123)",
                    isHoveddokument: false,
                    dokumentOrder: 1,
                },
            ],
            knyttTilSaker: [saksnummer1],
        };
        await waitFor(() => expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true);
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
    });

    it(`Should perform KOPIER_FRA_ANNEN_FAGOMRADE avvik with edited document`, async () => {
        const saksnummer1 = "12312312";
        const saksnummer2 = "55312312";
        const editedDocumentContent = "testtest";
        const titleEditedDocument = "Tittel på ny dokument";
        const journalpostFraAnnenFagomrade = {
            ...journalpostDto,
            fagomrade: "BAR",
            journalstatus: JournalStatus.JOURNALFOERT,
        };
        const broadcastMessage: BroadcastMessage<EditDocumentBroadcastMessage> = {
            ok: true,
            id: "",
            payload: {
                document: editedDocumentContent,
            },
        };
        sinonSandbox.stub(Broadcast, "waitForBroadcast").resolves(broadcastMessage);

        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve([sakData(personid, saksnummer1), sakData(personid, saksnummer2)]);
        });
        serviceStubs().hentJournalpostStub.callsFake(() => {
            return Promise.resolve(new JournalpostMapper(journalpostFraAnnenFagomrade).map());
        });
        await renderAvvikModal({
            pageType: PageType.VIS_JOURNALPOST,
            // initializeState: (mutableSnapshot) => mutableSnapshot.set(personState, { ident: "123213123" }),
        });
        const avvikModalElement = document.getElementsByClassName("AvvikshandteringModal").item(0)!;
        const avvikSimulator = new AvvikModalSimulator();
        await avvikSimulator.clickAvvikButton(AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE);

        // Velg dokumenter
        await avvikSimulator.clickDokumentCheckbox("alle");
        await avvikSimulator.clickAvvikConfirmButton();

        // Se gjennom og rediger
        await sleep(100);

        const redigerButtonElement = await screen.findByText("Rediger");
        fireEvent.click(redigerButtonElement);

        await waitFor(async () => expect(await screen.queryByText("Avbryt")).to.be.null);
        const titleInputElement = await screen.findByLabelText("Tittel på dokumentet");
        fireEvent.change(titleInputElement, { target: { value: titleEditedDocument } });

        await avvikSimulator.clickConfirmActionCheckbox();
        await avvikSimulator.clickAvvikConfirmButton();

        await sleep(100);

        // Velg sak
        await avvikSimulator.clickSakCheckbox(saksnummer1);
        await avvikSimulator.clickAvvikConfirmButton();

        await sleep(100);

        removeAttributesFromElement(avvikModalElement, "for", "id", "style");
        expect(avvikModalElement).to.matchSnapshot("KOPIER_FRA_ANNEN_FAGOMRADE sammendrag av endringer");

        await avvikSimulator.clickAvvikConfirmButton();

        expect(serviceStubs().lagreJournalpostStub.calledOnce).to.be.false;
        const expectedAvvik = {
            type: "KOPIER_FRA_ANNEN_FAGOMRADE",
            relevanteDokumenter: [
                {
                    tittel: titleEditedDocument,
                    dokument: editedDocumentContent,
                },
            ],
            knyttTilSaker: [saksnummer1],
        };
        await waitFor(() => expect(serviceStubs().sendAvvikStub.calledOnce).to.be.true);
        sinonSandbox.assert.calledOnceWithExactly(
            serviceStubs().sendAvvikStub,
            expectedAvvik,
            JOURNALPOST_ID,
            PALOGGET_ENHET,
            undefined,
        );
    });
});
