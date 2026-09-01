import { fireEvent } from "@testing-library/react";
import { expect } from "chai";
import React from "react";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";

import PersonSakNoAccessModal from "../../../pages/registrereJournalpost/components/modal/PersonSakNoAccessModal";
import PersonSakNoAccessWarning from "../../../pages/registrereJournalpost/components/modal/PersonSakNoAccessWarning";
import { AvvikType } from "../../../types/api/AvvikTypes";
import { LagreJournalpostRequest } from "../../../types/api/JournalpostTypes";
import type { Avvik } from "../../../types/avvik";
import { EnhetType } from "../../../types/enhet";
import type { Journalpost } from "../../../types/journalpost";
import type { Person } from "../../../types/person";
import type { Sak } from "../../../types/sak";
import { sinonSandbox } from "../../resources/mocha.init";
import { serviceStubs } from "../../resources/mockservice";
import {
    createEnhet,
    ENHET_IDENT_PERSON,
    enhetPersonResponse,
    PALOGGET_ENHET,
    PERSON_IDENT,
    PERSON_NAVN,
    SAKSNUMMER,
} from "../../resources/testdata";
import JournalpostBuilder from "../../resources/testdata/JournalpostData";
import { PersonBuilder } from "../../resources/testdata/PersonData";
import SakBuilder from "../../resources/testdata/SakData";
import AvvikModalSimulator from "../../utils/AvvikModalSimulator";
import { mountWithStore, mountWithStoreAndReactHookForm } from "../../utils/StoreInitializer";
import { sleep, waitForEvent } from "../../utils/TestDomUtils";
import RegisterJournalpostEventSimulator from "./RegisterJournalpostEventSimulator";

const SAK_EIERFOGD = "4080";
const person = new PersonBuilder.Builder(PERSON_IDENT).withNavn(PERSON_NAVN).withBegrensetTilgang(true).build();
const sak = new SakBuilder.Builder(SAKSNUMMER).withBegrensetTilgang(true).withEierfogd(SAK_EIERFOGD).build();
const journalpost: Journalpost = new JournalpostBuilder.Builder("BID-2020-TEST")
    .withJournalforendeEnhet(SAK_EIERFOGD)
    .build();

async function confirmOverforEnhetAvvik(sinonSandbox: SinonSandbox) {
    await waitForEvent(
        () => expect(document.querySelector(".AvvikshandteringModal") !== null).to.be.true,
        "Should show avvikmodal",
    );
    await sleep(100);
    new AvvikModalSimulator().clickAvvikConfirmButton();
    await waitForEvent(() => sinonSandbox.assert.calledOnce(serviceStubs().sendAvvikStub), "Should call sendAvvik");
}

describe("PersonSakNoAccessWarning", () => {
    const noAccessModalSimulator = new RegisterJournalpostEventSimulator().noAccessModal();
    const onCancelStub: SinonStub = sinonSandbox.stub();
    const renderPersonOrSakNoAccessWarning = async (sak?: Sak, person?: Person) => {
        mountWithStoreAndReactHookForm(<PersonSakNoAccessWarning sak={sak} onCancel={onCancelStub} person={person} />, {
            saksnummer: "",
        });
        await waitForEvent(
            () => expect(document.querySelector(".no-access-modal-content")).to.be.not.null,
            "No person access should render",
        );
    };

    beforeEach(() => {
        serviceStubs().hentPersonGeografiskEnhetStub.resolves(
            createEnhet(ENHET_IDENT_PERSON, "NAV Vikafossen", EnhetType.SPESIALENHETER),
        );
        serviceStubs().hentEnhetInfoStub.resolves(
            createEnhet(SAK_EIERFOGD, "NAV Vikafossen", EnhetType.SPESIALENHETER),
        );
        serviceStubs().hentJournalpostStub.callsFake(() =>
            Promise.resolve(
                new JournalpostBuilder.Builder("BID-2020-TEST").withJournalforendeEnhet(SAK_EIERFOGD).build(),
            ),
        );
        serviceStubs().personStub.resolves(person);
    });

    describe("No access to person", () => {
        it("should render no access to person warning panel", async () => {
            const sakInput = undefined;
            await renderPersonOrSakNoAccessWarning(sakInput, person);
            const noAccessInfElement = document.querySelector(".no-access-modal");
            expect(noAccessInfElement !== null).to.be.true;
            expect(document.querySelector(".alertstripe__tekst")).to.matchSnapshot();
        });

        it("should render no access to person warning panel when journalpost has same enhet", async () => {
            const sakInput = undefined;
            const journalpostWithPersonEnhet = {
                ...journalpost,
                journalforendeEnhet: enhetPersonResponse.enhetIdent,
            };
            serviceStubs().hentJournalpostStub.callsFake(() => Promise.resolve(journalpostWithPersonEnhet));
            await renderPersonOrSakNoAccessWarning(sakInput, person);
            const noAccessInfElement = document.querySelector(".no-access-modal");
            expect(noAccessInfElement !== null).to.be.true;
            expect(document.querySelector(".alertstripe__tekst")).to.matchSnapshot();
        });

        it("should call avvik and lagre journalpost when confirm button pressed", async () => {
            await renderPersonOrSakNoAccessWarning(undefined, person);
            expect(document.querySelector(".AvvikshandteringModal") !== null).to.be.false;
            expect(document.querySelector(".confirmbutton").textContent).to.be.equal("Overfør");
            noAccessModalSimulator.clickSubmitButton();
            await confirmOverforEnhetAvvik(sinonSandbox);

            const expectedAvvikRequest: Avvik = {
                type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
                nyttEnhetsnummer: ENHET_IDENT_PERSON,
                gammeltEnhetsnummer: journalpost.journalforendeEnhet,
            };
            const expectedJournalpost = new LagreJournalpostRequest(journalpost.journalpostId);
            expectedJournalpost.gjelder = person.ident;
            sinonSandbox.assert.calledOnceWithMatch(
                serviceStubs().sendAvvikStub,
                expectedAvvikRequest,
                journalpost.journalpostId,
                PALOGGET_ENHET,
            );
            sinonSandbox.assert.calledOnceWithExactly(
                serviceStubs().lagreJournalpostStub,
                journalpost.journalpostId,
                ENHET_IDENT_PERSON,
                expectedJournalpost,
            );
        });

        it("should only call lagre journalpost when person and journalpost has same enhet", async () => {
            const journalpostWithPersonEnhet = {
                ...journalpost,
                journalforendeEnhet: enhetPersonResponse.enhetIdent,
            };
            serviceStubs().hentJournalpostStub.callsFake(() => Promise.resolve(journalpostWithPersonEnhet));
            await renderPersonOrSakNoAccessWarning(undefined, person);
            noAccessModalSimulator.clickSubmitButton();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().oppgaveListeStub),
                "Should redirect to oppgaveliste",
            );
            const expectedJournalpost = new LagreJournalpostRequest(journalpost.journalpostId);
            expectedJournalpost.gjelder = person.ident;
            sinonSandbox.assert.notCalled(serviceStubs().sendAvvikStub);
            sinonSandbox.assert.calledOnceWithExactly(
                serviceStubs().lagreJournalpostStub,
                journalpost.journalpostId,
                PALOGGET_ENHET,
                expectedJournalpost,
            );
        });

        it.skip("should show only save journalpost when no enhet found for person", async () => {
            serviceStubs().hentPersonGeografiskEnhetStub.resolves({ enhetNavn: "Ukjent", enhetIdent: "" });
            await renderPersonOrSakNoAccessWarning(undefined, person);
            noAccessModalSimulator.clickSubmitButton();
            await sleep(100);
            sinonSandbox.assert.notCalled(serviceStubs().sendAvvikStub);
            sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub);
            sinonSandbox.assert.calledOnce(serviceStubs().oppgaveListeStub);
        });
    });

    describe("No access to sak", () => {
        it("should render no access to sak warning panel", async () => {
            await renderPersonOrSakNoAccessWarning(sak);
            const noAccessInfElement = document.querySelector(".no-access-modal");
            expect(noAccessInfElement !== null).to.be.true;
            expect(document.querySelector(".alertstripe__tekst")).to.matchSnapshot();
        });
        it("should render no access to sak warning panel when journalpost has same enhet", async () => {
            await renderPersonOrSakNoAccessWarning(sak, undefined);
            const noAccessInfElement = document.querySelector(".no-access-modal");
            expect(noAccessInfElement !== null).to.be.true;
            expect(document.querySelector(".alertstripe__tekst")).to.matchSnapshot();
        });

        it("should open avvik modal when confirm button pressed for sak", async () => {
            const journalpostNotSameEnhet = {
                ...journalpost,
                journalforendeEnhet: "2000",
            };
            serviceStubs().hentJournalpostStub.callsFake(() => Promise.resolve(journalpostNotSameEnhet));
            serviceStubs().personStub.resolves({ ident: "" });
            await renderPersonOrSakNoAccessWarning(sak, undefined);
            expect(document.querySelector("AvvikshandteringModal") !== null).to.be.false;
            expect(document.querySelector(".confirmbutton").textContent).to.be.equal("Overfør");
            noAccessModalSimulator.clickSubmitButton();
            await confirmOverforEnhetAvvik(sinonSandbox);
            const expectedAvvikRequest: Avvik = {
                type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
                nyttEnhetsnummer: SAK_EIERFOGD,
                gammeltEnhetsnummer: journalpostNotSameEnhet.journalforendeEnhet,
            };
            sinonSandbox.assert.calledOnceWithMatch(
                serviceStubs().sendAvvikStub,
                expectedAvvikRequest,
                journalpost.journalpostId,
                PALOGGET_ENHET,
            );
            sinonSandbox.assert.notCalled(serviceStubs().lagreJournalpostStub);
        });

        it("should only be able to go to oppgaveliste when sak and journalpost has same enhet", async () => {
            await renderPersonOrSakNoAccessWarning(sak, undefined);
            const expectedJournalpost = new LagreJournalpostRequest(journalpost.journalpostId);
            expectedJournalpost.tilknyttSaker = [sak.saksnummer];
            expect(document.querySelector(".confirmbutton").textContent).to.be.equal("Til oppgaveliste");
            noAccessModalSimulator.clickSubmitButton();
            sinonSandbox.assert.calledOnce(serviceStubs().oppgaveListeStub);
            sinonSandbox.assert.notCalled(serviceStubs().sendAvvikStub);
            sinonSandbox.assert.notCalled(serviceStubs().lagreJournalpostStub);
        });
    });

    it("should cancel when no access cancel button pressed", async () => {
        await renderPersonOrSakNoAccessWarning(undefined, person);
        fireEvent.click(document.querySelector(".cancelbutton"));
        expect(onCancelStub.calledOnce).to.be.true;
    });
});

describe("PersonOrSakNoAccessModal", () => {
    const closeModalFn = sinon.stub();
    const onSubmitFn = sinon.stub();
    const enhetIdent = "2030";
    const enhetNavn = "Nav test";
    const renderSakstilknytninNoAccessModal = async (sak?: Sak, person?: Person, journalpostHasSameEnhet?: boolean) => {
        mountWithStore(
            <PersonSakNoAccessModal sak={sak} person={person} onCancel={closeModalFn} onSubmit={onSubmitFn} />,
            {
                initializeState: (mutableSnapshot) => {
                    // mutableSnapshot.set(hentEnhetsInfoQuery(enhetIdent), {
                    //     enhetIdent: enhetIdent,
                    //     enhetNavn: enhetNavn,
                    // });
                    // mutableSnapshot.set(personGeografiskEnhetState, { enhetIdent: enhetIdent, enhetNavn: enhetNavn });
                },
            },
        );
        await waitForEvent(
            () => expect(document.querySelector(".no-access-modal-content")).to.be.not.null,
            "No access modal should render",
        );
    };

    it("Should render no access modal when sak has limited access with same journalpost enhet", async () => {
        await renderSakstilknytninNoAccessModal({
            saksnummer: "200000",
            eierfogd: enhetIdent,
            roller: [],
            begrensetTilgang: true,
        });
        expect(document.querySelector(".no-access-modal-content")).to.matchSnapshot();
    });

    it("Should render no access modal when person has limited access with same journalpost enhet", async () => {
        await renderSakstilknytninNoAccessModal(undefined, { ident: "0505055343" });
        expect(document.querySelector(".no-access-modal-content")).to.matchSnapshot();
    });

    it("Should render no access modal when journalpost and personenhet is same", async () => {
        await renderSakstilknytninNoAccessModal(undefined, { ident: "0505055343" }, true);
        expect(document.querySelector(".no-access-modal-content")).to.matchSnapshot();
    });

    it("Should render no access modal when journalpost and sak enhet is same", async () => {
        await renderSakstilknytninNoAccessModal(
            {
                saksnummer: "200000",
                eierfogd: enhetIdent,
                roller: [],
                begrensetTilgang: true,
            },
            undefined,
            true,
        );
        expect(document.querySelector(".no-access-modal-content")).to.matchSnapshot();
    });
});
