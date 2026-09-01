import { expect } from "chai";
import React from "react";

import SakstilknyttningPanel from "../../../pages/registrereJournalpost/components/sakstilknytning/SakstilknyttningPanel";
import { AvvikType } from "../../../types/api/AvvikTypes";
import {
    PERSON_ID_7,
    PERSON_ID_8,
    PERSON_ID_9,
    PERSON_ID_10,
    PERSON_ID_11,
    PERSON_ID_12,
    PERSON_ID_13,
} from "../../mockdata/personMockData";
import { serviceStubs } from "../../resources/mockservice";
import {
    createPerson,
    NY_OPPRETTET_SAKSNUMMER,
    PALOGGET_ENHET,
    sakData,
    sakDataWithDiskresjon,
} from "../../resources/testdata";
import SakBuilder from "../../resources/testdata/SakData";
import ModalAssertion from "../../utils/ModalAssertion";
import NoAccessModalAssertion from "../../utils/NoAccessModalAssertion";
import { SakTableAssertion } from "../../utils/SakTableAssertion";
import { mountWithStoreAndReactHookForm } from "../../utils/StoreInitializer";
import { sleep, waitForEvent } from "../../utils/TestDomUtils";

describe("[Registrer] tilknyttetSak", () => {
    const renderSakstilktnytningPanel = () => <SakstilknyttningPanel />;
    beforeEach(() => {
        serviceStubs().personStub.resetBehavior();
        serviceStubs().personStub.resolves(createPerson());
        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve([sakData(personid)]);
        });
    });

    it("should render saker with limited access and show modal when selected", async () => {
        const saksnummer = "020202";
        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve([sakDataWithDiskresjon(personid, saksnummer)]);
        });

        mountWithStoreAndReactHookForm(renderSakstilktnytningPanel());

        const tableAssertion = new SakTableAssertion();
        await waitForEvent(() => tableAssertion.assertTableExists(), "Table should render");
        tableAssertion
            .assertNumberOfRows(1)
            .assertRowWithSaksnummerExists(saksnummer)
            .assertOverforSakButtonExists(saksnummer)
            .clickSakCheckbox(saksnummer);

        const noAccessModalAssertion = new NoAccessModalAssertion().withModalSelector(".no-access-modal");
        await waitForEvent(() => noAccessModalAssertion.assertNotLoadingData(), "Wait for no access modal loaded data");
        noAccessModalAssertion.assertModalExists().clickSubmitButton();

        // Show Avvikshandteringmodal after submit
        const modalAssertion = new ModalAssertion().withModalSelector(".AvvikshandteringModal");
        await waitForEvent(() => modalAssertion.assertModalExists(), "Table should render");
    });
    it("should render saktable with multiple rows and ny sak", async () => {
        // GIVEN
        const nasjonalSakMedTreRoller = new SakBuilder.Builder("1500001")
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withHovedRolle(PERSON_ID_7, "BM")
            .withMotsattRolle(PERSON_ID_8, "BP")
            .withRolle(PERSON_ID_9, "BA")
            .withRolle(PERSON_ID_10, "BP")
            .build();

        const nyNasjonalSakMedRoller = new SakBuilder.Builder("1500002")
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withHovedRolle(PERSON_ID_11, "BP")
            .withMotsattRolle(PERSON_ID_11, "BM")
            .withRolle(PERSON_ID_12, "BA")
            .withRolle(PERSON_ID_13, "BP")
            .build();
        serviceStubs().hentSakerForPersonStub.resolves([nasjonalSakMedTreRoller, nyNasjonalSakMedRoller]);

        mountWithStoreAndReactHookForm(renderSakstilktnytningPanel());
        const tableAssertion = new SakTableAssertion();

        await waitForEvent(() => tableAssertion.assertTableExists(), "Table should render");

        serviceStubs().hentSakerForPersonStub.reset();
        serviceStubs().hentSakerForPersonStub.resolves([
            nasjonalSakMedTreRoller,
            nyNasjonalSakMedRoller,
            sakData(PERSON_ID_7, NY_OPPRETTET_SAKSNUMMER),
        ]);
        tableAssertion.assertTableExists().assertNumberOfRows(2).clickNySakButton().clickOpprettSakModalButton();

        await sleep(400);
        await waitForEvent(() => tableAssertion.assertNumberOfRows(3), "Table should have 3 rows");
        tableAssertion.assertNumberOfSelectedRows(1).clickSakCheckbox("1500001").assertNumberOfSelectedRows(2);
    });

    it("should render overfør button only if different enhet", async () => {
        // GIVEN
        const saksnummerWithDifferentEnhet = "1500002";
        const saksnummerWithSameEnhet = "1500001";
        const nasjonalSakMedTreRoller = new SakBuilder.Builder(saksnummerWithSameEnhet)
            .withEierfogd(PALOGGET_ENHET)
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withHovedRolle(PERSON_ID_9, "BM")
            .withMotsattRolle(PERSON_ID_10, "BP")
            .withRolle(PERSON_ID_11, "BA")
            .withRolle(PERSON_ID_12, "BP")
            .build();

        const nyNasjonalSakMedRoller = new SakBuilder.Builder(saksnummerWithDifferentEnhet)
            .withEierfogd("4812")
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withHovedRolle(PERSON_ID_9, "BP")
            .withMotsattRolle(PERSON_ID_10, "BM")
            .withRolle(PERSON_ID_11, "BA")
            .withRolle(PERSON_ID_12, "BP")
            .build();

        serviceStubs().hentSakerForPersonStub.resolves([nasjonalSakMedTreRoller, nyNasjonalSakMedRoller]);

        mountWithStoreAndReactHookForm(renderSakstilktnytningPanel(), {
            initializeState: (mutableSnapshot) => {
                // mutableSnapshot.set(sakerPersonQuery, [nasjonalSakMedTreRoller, nyNasjonalSakMedRoller]);
            },
        });
        const tableAssertion = new SakTableAssertion();
        await waitForEvent(() => tableAssertion.assertTableExists(), "Table should render");
        tableAssertion
            .assertTableExists()
            .assertNumberOfRows(2)
            .assertOverforSakButtonExists(saksnummerWithDifferentEnhet)
            .assertOverforSakButtonNotExists(saksnummerWithSameEnhet);
    });

    it("click on overforbutton should open avvikmodal", async () => {
        // GIVEN
        const saksnummerWithDifferentEnhet = "1500002";
        const nyttEnhetsnummer = "4812";
        serviceStubs().sendAvvikStub.resolves({ ok: true });
        const nasjonalSakMedTreRoller = new SakBuilder.Builder(saksnummerWithDifferentEnhet)
            .withEierfogd(nyttEnhetsnummer)
            .withSaksstatus("AK")
            .withKategori("N")
            .withParagraf19(false)
            .withHovedRolle(PERSON_ID_7, "BM")
            .withMotsattRolle(PERSON_ID_8, "BP")
            .withRolle(PERSON_ID_9, "BA")
            .withRolle(PERSON_ID_10, "BP")
            .build();

        serviceStubs().hentSakerForPersonStub.resolves([nasjonalSakMedTreRoller]);

        mountWithStoreAndReactHookForm(renderSakstilktnytningPanel());

        const tableAssertion = new SakTableAssertion();
        await waitForEvent(() => tableAssertion.assertTableExists(), "Table should render");
        tableAssertion
            .assertTableExists()
            .assertNumberOfRows(1)
            .assertOverforSakButtonExists(saksnummerWithDifferentEnhet)
            .clickOverforSakButton(saksnummerWithDifferentEnhet);

        const modalAssertion = new ModalAssertion().withModalSelector(".AvvikshandteringModal");
        await waitForEvent(() => modalAssertion.assertModalExists(), "Table should render");

        modalAssertion.clickButton(".navds-button.navds-button--primary");
        await sleep(500);
        await waitForEvent(
            () => expect(document.querySelector(".nav-veilederpanel--suksess")).to.be.not.null,
            "Should show avvik success",
        );
        expect(serviceStubs().sendAvvikStub.getCall(0).firstArg.nyttEnhetsnummer === nyttEnhetsnummer).to.be.true;
        expect(serviceStubs().sendAvvikStub.getCall(0).firstArg.type === AvvikType.OVERFOR_TIL_ANNEN_ENHET).to.be.true;
        serviceStubs().sendAvvikStub.restore();
    });
});
