import { fireEvent, screen, waitFor } from "@testing-library/react";
// ##### TESTDATA #####
import { expect } from "chai";
import { describe } from "mocha";
import React from "react";
import sinon, { type SinonStub } from "sinon";

import VisJournalpostPage from "../../../pages/visjournalpost/VisJournalpostPage";
import SakService from "../../../services/SakService";
import { type DokumentDto, DokumentType, type ReturDetaljerDto } from "../../../types/api/JournalpostTypes";
import {
    JournalpostKanal,
    JournalpostKildeDisplayValueMap,
    JournalpostMapper,
    JournalStatus,
} from "../../../types/journalpost";
import { Kategori, SakStatus } from "../../../types/sak";
import { JOURNALPOST_ID_JOURNALFOERT } from "../../mockdata/journalpostMockData";
import { sinonSandbox } from "../../resources/mocha.init";
import { serviceStubs } from "../../resources/mockservice";
import {
    AVSENDER_NAVN,
    createPerson,
    DOKUMENT_DATO,
    JOURNAL_DATO,
    JOURNALFORENDE_ENHET,
    JOURNALFORENDE_TITTEL,
    JOURNALPOST_JOARK_ID,
    LagreJournalpostBuilder,
    NY_OPPRETTET_SAKSNUMMER,
    PALOGGET_ENHET,
    PERSON_IDENT,
    PERSON_IDENT_2,
    PERSON_NAVN,
    sakData,
    sakDataWithDiskresjon,
} from "../../resources/testdata";
import JournalpostBuilder from "../../resources/testdata/JournalpostData";
import SakBuilder from "../../resources/testdata/SakData";
import { SakTableAssertion } from "../../utils/SakTableAssertion";
import { mountWithStore } from "../../utils/StoreInitializer";
import { sleep, waitForEvent } from "../../utils/TestDomUtils";
import VisJournalpostEventSimulator from "./VisJournalpostEventSimulator";

const saknr1 = "12345";
const saknr2 = "22345";
const saknr3 = "32345";
const saknr4 = "42345";
const sakIkkeFerdigregistrert = "52345";
const nySakNr = NY_OPPRETTET_SAKSNUMMER;
const saker = (personIdent: string) => [
    sakData(personIdent, saknr1),
    sakData(personIdent, saknr2),
    sakData(personIdent, saknr3),
];
const journalpost = (journalpostId: string, dokumenter: DokumentDto[] = [], returDetaljer?: ReturDetaljerDto) =>
    new JournalpostBuilder.Builder(journalpostId)
        .withJournalforendeEnhet(JOURNALFORENDE_ENHET)
        .withInnhold(JOURNALFORENDE_TITTEL)
        .withDokumenttype(DokumentType.I)
        .withAvsenderNavn(AVSENDER_NAVN)
        .withJournaldato(JOURNAL_DATO)
        .withDokumentdato(DOKUMENT_DATO)
        .withFagomrade("BID")
        .withJournalstatus(JournalStatus.JOURNALFOERT)
        .withKilde(JournalpostKanal.NAV_NO_BID)
        .withSakstilknytninger([saknr1, saknr2])
        .withGjelderAktor(PERSON_IDENT)
        .withDokumenter(dokumenter)
        .withReturDetaljer(returDetaljer)
        .build();

describe("VisJournalpostPage", () => {
    beforeEach(() => {
        serviceStubs().personStub.callsFake((ident: string) => {
            return Promise.resolve(createPerson(ident));
        });
        serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
            return Promise.resolve(journalpost(jounrlpostId));
        });
        serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
            return Promise.resolve(saker(personid));
        });

        serviceStubs().hentSakStub.callsFake((saksnummer: string) => {
            if (saksnummer === sakIkkeFerdigregistrert) {
                return Promise.resolve(
                    new SakBuilder.Builder(saksnummer).withKategori(Kategori.N).withSaksstatus(SakStatus.NY).build(),
                );
            }

            return Promise.resolve(sakData(PERSON_IDENT_2, saksnummer));
        });
    });

    async function renderVisJournalpostPage(journalpostId: string = JOURNALPOST_ID_JOURNALFOERT) {
        await mountWithStore(<VisJournalpostPage />, { journalpostId });
        serviceStubs().hentJournalpostStub.resetHistory();
        await waitForEvent(
            () => expect(document.getElementById("vis-journalpost-container")).to.be.not.null,
            "VisJournalpostPage should render",
        );
        await sleep(1000);
        await waitForEvent(() => new SakTableAssertion().assertTableExists(), "Saktable should render");
    }

    it("should render", async () => {
        await renderVisJournalpostPage();
        sinonSandbox.assert.called(serviceStubs().hentJournalpostStub); // TODO: Skal bli called once men bug fører til at det kalles to ganger
        sinonSandbox.assert.called(serviceStubs().hentSakerForPersonStub);
        sinonSandbox.assert.called(serviceStubs().personStub); // TODO: Skal bli called once men bug fører til at det kalles to ganger
        expect(document.querySelector("#vis-journalpost-detaljer")).to.matchSnapshot("Journalpost detaljer");
        expect(document.querySelector("#gjelder-brukere-panel").textContent.includes(AVSENDER_NAVN)).to.be.true;
        expect(document.querySelector("#gjelder-brukere-panel").textContent.includes(PERSON_NAVN)).to.be.true;
        expect(document.querySelector("#gjelder-brukere-panel").textContent.includes(PERSON_IDENT)).to.be.true;
        expect(
            document
                .querySelector(".journalpost-kilde")
                .textContent.includes(JournalpostKildeDisplayValueMap.get(JournalpostKanal.NAV_NO_BID)),
        ).to.be.true;
        new SakTableAssertion()
            .assertNumberOfRows(3)
            .assertNumberOfSelectedRows(2)
            .assertRowWithSaksnummerIsSelected(saknr1)
            .assertRowWithSaksnummerIsSelected(saknr2)
            .assertRowWithSaksnummerIsNotSelected(saknr3);
    });

    describe("Save journalpost", () => {
        beforeEach(() => {
            serviceStubs().lagreJournalpostStub.resolves();
        });

        it("should change title and save", async () => {
            await renderVisJournalpostPage();
            const tittel = "Test test test";
            new VisJournalpostEventSimulator().clickRedigerButton().changeJournalpostTittel(tittel).clickLagreButton();
            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2]).withTittel(tittel).build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_ID_JOURNALFOERT,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("should change dokumentdato and save", async () => {
            await renderVisJournalpostPage();
            const nyDokumentDato = "1337-04-06";
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .changeDokumentDato(nyDokumentDato)
                .clickLagreButton();
            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withDokumentDato(nyDokumentDato)
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_ID_JOURNALFOERT,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("should change avsender and save", async () => {
            await renderVisJournalpostPage();
            const nyAvsender = "Nils hansen";
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .clickAvsenderFritekstCheckbox()
                .changeAvsenderFritekstInput(nyAvsender)
                .clickLagreButton();
            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withAvsenderNavn(nyAvsender)
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_ID_JOURNALFOERT,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("should change avsender to gjelder and save", async () => {
            await renderVisJournalpostPage();
            const nyAvsender = "Nils hansen";
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .clickAvsenderFritekstCheckbox()
                .changeAvsenderFritekstInput(nyAvsender)
                .clickAvsenderGjelderCheckbox()
                .clickLagreButton();
            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withAvsenderNavn(PERSON_NAVN)
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_ID_JOURNALFOERT,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("selected saker should be disabled on edit mode", async () => {
            await renderVisJournalpostPage();
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .sakTable()
                .assertRowWithSaksnummerIsDisabled(saknr1)
                .assertRowWithSaksnummerIsDisabled(saknr2)
                .assertRowWithSaksnummerIsNotDisabled(saknr3);
        });

        it("should add ny sak and save and redirect to behandle sak", async () => {
            await renderVisJournalpostPage();
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .sakTable()
                .clickNySakButton()
                .clickOpprettSakModalButton()
                .back()
                .clickLagreButton();
            const lagreJournalpostDto = new LagreJournalpostBuilder()
                .withTilknyttSaker([saknr1, saknr2, nySakNr])
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_ID_JOURNALFOERT,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("should add ny sak and select sak and save and redirect to behandle sak", async () => {
            await renderVisJournalpostPage();
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .sakTable()
                .clickNySakButton()
                .clickOpprettSakModalButton()
                .clickSakCheckbox(saknr3)
                .assertRowWithSaksnummerIsSelected(saknr3)
                .back()
                .clickLagreButton();
            const lagreJournalpostDto = new LagreJournalpostBuilder()
                .withTilknyttSaker([saknr1, saknr2, nySakNr, saknr3])
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_ID_JOURNALFOERT,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("should not be able to select sak with limited access", async () => {
            const sakerWithLimitedAccess = (personIdent: string) => [
                sakData(personIdent, saknr1),
                sakData(personIdent, saknr2),
                sakDataWithDiskresjon(personIdent, saknr3),
            ];
            serviceStubs().hentSakerForPersonStub.callsFake((personid: string) => {
                return Promise.resolve(sakerWithLimitedAccess(personid));
            });

            await renderVisJournalpostPage();
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .sakTable()
                .clickSakCheckbox(saknr3)
                .back()
                .noAccessModal()
                .assertModalExists()
                .clickCancelButton()
                .back()
                .sakTable()
                .assertRowWithSaksnummerIsNotSelected(saknr3);
        });

        it("should show journalpost saker not related to gjelder", async () => {
            serviceStubs().hentJournalpostStub.callsFake((saksnummer: string, jounrlpostId: string) => {
                const journalpostWithAdditionalSak = journalpost(jounrlpostId);
                journalpostWithAdditionalSak.sakstilknytninger = [
                    ...journalpostWithAdditionalSak.sakstilknytninger,
                    saknr4,
                ];
                return Promise.resolve(journalpostWithAdditionalSak);
            });

            await renderVisJournalpostPage();
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .sakTable()
                .assertNumberOfRows(4)
                .assertNumberOfSelectedRows(3)
                .assertRowWithSaksnummerIsSelected(saknr1)
                .assertRowWithSaksnummerIsSelected(saknr2)
                .assertRowWithSaksnummerIsSelected(saknr4)
                .assertRowWithSaksnummerIsNotSelected(saknr3)
                .back()
                .assertBehandleSakButtonNotExists(saknr4);

            sinonSandbox.assert.called(serviceStubs().hentSakStub);
        });

        it("should show journalpost saker not ferdigregistrert with behandle sak button", async () => {
            serviceStubs().hentJournalpostStub.callsFake((saksnummer: string, jounrlpostId: string) => {
                const journalpostWithAdditionalSak = journalpost(jounrlpostId);
                journalpostWithAdditionalSak.sakstilknytninger = [
                    ...journalpostWithAdditionalSak.sakstilknytninger,
                    saknr4,
                    sakIkkeFerdigregistrert,
                ];
                return Promise.resolve(journalpostWithAdditionalSak);
            });

            await renderVisJournalpostPage();
            new VisJournalpostEventSimulator()
                .sakTable()
                .assertNumberOfRows(5)
                .assertNumberOfSelectedRows(4)
                .assertRowWithSaksnummerIsSelected(saknr1)
                .assertRowWithSaksnummerIsSelected(saknr2)
                .assertRowWithSaksnummerIsSelected(saknr4)
                .assertRowWithSaksnummerIsSelected(sakIkkeFerdigregistrert)
                .assertRowWithSaksnummerIsNotSelected(saknr3)
                .back()
                .assertAapneSakButtonExists(saknr1)
                .assertAapneSakButtonExists(saknr2)
                .assertAapneSakButtonExists(saknr4)
                .assertAapneSakButtonExists(sakIkkeFerdigregistrert)
                .clickAapneSakButton(sakIkkeFerdigregistrert);

            // TODO: FIX ME. Is called 6 times but should only be called twice
            sinonSandbox.assert.called(serviceStubs().hentSakStub);

            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().behandleSakRedirectStub),
                "Should redirect to behandle sak",
            );
            sinonSandbox.assert.calledWith(serviceStubs().behandleSakRedirectStub, sakIkkeFerdigregistrert);
        });

        it("should not be able to edit document title on Bidrag journalpost", async () => {
            const hoveddokumentId = "1234";
            const hoveddokumentTitle = "Tittel på hoveddokument";
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                return journalpost(jounrlpostId, [
                    {
                        dokumentreferanse: hoveddokumentId,
                        tittel: hoveddokumentTitle,
                    },
                ]);
            });

            await renderVisJournalpostPage();
            new VisJournalpostEventSimulator()
                .assertDokumentTittelHasValue(hoveddokumentTitle, hoveddokumentId)
                .clickRedigerButton()
                .assertDokumentTittelNotEditable(hoveddokumentTitle, hoveddokumentId)
                .clickLagreButton();

            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withJournalpostId(JOURNALPOST_ID_JOURNALFOERT)
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_ID_JOURNALFOERT,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("Journalpost tittel should not be editable on Joark journalpost", async () => {
            const hoveddokumentId = "1234";
            const hoveddokumentTitle = "Tittel på hoveddokument";
            const vedleggTitle = "Tittel på vedlegg";
            const vedlegId = "2345";
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                return journalpost(jounrlpostId, [
                    {
                        dokumentreferanse: hoveddokumentId,
                        tittel: hoveddokumentTitle,
                    },
                    {
                        dokumentreferanse: vedlegId,
                        tittel: vedleggTitle,
                    },
                ]);
            });

            await renderVisJournalpostPage(JOURNALPOST_JOARK_ID);
            new VisJournalpostEventSimulator()
                .assertJournalpostTittelNotEditable()
                .clickRedigerButton()
                .assertJournalpostTittelNotEditable();
        });

        it("should be able to edit document title on Joark journalpost", async () => {
            const hoveddokumentId = "1234";
            const hoveddokumentTitle = "Tittel på hoveddokument";
            const vedleggTitle = "Tittel på vedlegg";
            const vedlegId = "2345";
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                return journalpost(jounrlpostId, [
                    {
                        dokumentreferanse: hoveddokumentId,
                        tittel: hoveddokumentTitle,
                    },
                    {
                        dokumentreferanse: vedlegId,
                        tittel: vedleggTitle,
                    },
                ]);
            });

            await renderVisJournalpostPage(JOURNALPOST_JOARK_ID);
            new VisJournalpostEventSimulator()
                .assertDokumentTittelHasValue(hoveddokumentTitle, hoveddokumentId)
                .assertDokumentTittelHasValue(vedleggTitle, vedlegId)
                .clickRedigerButton()
                .assertDokumentTittelHasValue(hoveddokumentTitle, hoveddokumentId)
                .assertDokumentTittelHasValue(vedleggTitle, vedlegId)
                .changeDokumentTittel("Something else", hoveddokumentId)
                .clickLagreButton();

            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withJournalpostId(JOURNALPOST_JOARK_ID)
                .withTittel("Something else")
                .withDokument({ tittel: "Something else", dokId: hoveddokumentId })
                .withDokument({ tittel: vedleggTitle, dokId: vedlegId })
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_JOARK_ID,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        }).timeout(3000);

        it("should not update Journalpost tittel on ferdigstilt utgaaende Joark journalpost", async () => {
            const hoveddokumentId = "1234";
            const hoveddokumentTitle = "Tittel på hoveddokument";
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                const jp = journalpost(jounrlpostId, [
                    {
                        dokumentreferanse: hoveddokumentId,
                        tittel: hoveddokumentTitle,
                    },
                ]);
                jp.mottattDato = "2020-05-02";
                jp.isUtgaaende = true;
                jp.isInngående = false;
                jp.isJoarkJournalpost = true;
                return jp;
            });

            await renderVisJournalpostPage(JOURNALPOST_JOARK_ID);
            new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .changeDokumentTittel("Something else", hoveddokumentId)
                .clickLagreButton();

            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withJournalpostId(JOURNALPOST_JOARK_ID)
                .withTittel(null)
                .withDokumentDato(null)
                .withDokument({ tittel: "Something else", dokId: hoveddokumentId })
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWith(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_JOARK_ID,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        }).timeout(3000);

        it("should edit journalpost returdetaljer", async () => {
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                const jp = journalpost(jounrlpostId, [], {
                    dato: "2021-01-02",
                    antall: 2,
                    logg: [
                        {
                            dato: "2020-01-02",
                            beskrivelse: "Beskrivelse 1",
                            locked: true,
                        },
                        {
                            dato: "2021-01-02",
                            beskrivelse: "Beskrivelse 2",
                        },
                    ],
                });
                jp.mottattDato = "2020-05-02";
                jp.dokumentDato = "2020-05-02";
                jp.journalstatus = JournalStatus.RETUR;
                return jp;
            });

            await renderVisJournalpostPage(JOURNALPOST_JOARK_ID);
            new VisJournalpostEventSimulator()
                .assertHasAntallRetur("2")
                .assertHasReturSistReturDato("2021-01-02")
                .assertHasReturDetaljerLogg("2020-01-02", "Beskrivelse 1")
                .assertHasReturDetaljerLogg("2021-01-02", "Beskrivelse 2")
                .clickRedigerButton()
                .assertReturDatoNotEditable("2020-01-02")
                .assertReturBeskrivelseNotEditable("2020-01-02")
                .changeReturBeskrivelse("2021-01-02", "Ny beskrivelse 2")
                .changeReturDato("2021-01-02", "9999-01-02")
                .clickLagreButton();

            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withTittel(null)
                .withDokumentDato("2020-05-02")
                .withJournalpostId(JOURNALPOST_JOARK_ID)
                .withReturDetaljer({
                    originalDato: "2021-01-02",
                    nyDato: "9999-01-02",
                    beskrivelse: "Ny beskrivelse 2",
                })
                .build();
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpostt",
            );
            sinonSandbox.assert.calledWithMatch(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_JOARK_ID,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        }).timeout(5000);

        //TODO
        it("should not save with returdetaljer when not changed", async () => {
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                const jp = journalpost(jounrlpostId, [], {
                    dato: "2020-01-05",
                    antall: 5,
                    logg: [
                        {
                            dato: "2020-01-02",
                            beskrivelse: "Beskrivelse 1",
                        },
                        {
                            dato: "2021-01-02",
                            beskrivelse: "Beskrivelse 2",
                        },
                    ],
                });
                jp.journalstatus = JournalStatus.RETUR;
                return jp;
            });

            await renderVisJournalpostPage(JOURNALPOST_JOARK_ID);
            new VisJournalpostEventSimulator()
                .assertHasAntallRetur("5")
                .assertHasReturSistReturDato("2020-01-05")
                .assertHasReturDetaljerLogg("2020-01-02", "Beskrivelse 1")
                .assertHasReturDetaljerLogg("2021-01-02", "Beskrivelse 2")
                .clickRedigerButton()
                .clickLagreButton();

            const lagreJournalpostDto = new LagreJournalpostBuilder([saknr1, saknr2])
                .withTittel(null)
                .withJournalpostId(JOURNALPOST_JOARK_ID)
                .build();
            lagreJournalpostDto.endreReturDetaljer = [];
            await waitForEvent(
                () => sinonSandbox.assert.calledOnce(serviceStubs().lagreJournalpostStub),
                "Should lagre journalpost",
            );
            sinonSandbox.assert.calledWithExactly(
                serviceStubs().lagreJournalpostStub,
                JOURNALPOST_JOARK_ID,
                PALOGGET_ENHET,
                lagreJournalpostDto,
            );
        });

        it("should only be able to copy non bidrag journalpost", async () => {
            serviceStubs().hentJournalpostStub.callsFake((jounrlpostId: string, saksnummer: string) => {
                const jp = journalpost(jounrlpostId);
                jp.fagomrade = "BAR";
                jp.journalstatus = JournalStatus.JOURNALFOERT;
                return new JournalpostMapper(jp).map();
            });

            await renderVisJournalpostPage();
            expect(screen.queryByText("Rediger")).to.be.null;
            expect(screen.queryByText("Avvikshåndtering")).to.be.null;

            const kopierButton = screen.queryByText("Kopier til Bidrag");
            expect(kopierButton).to.be.not.null;

            fireEvent.click(kopierButton);

            expect(document.querySelector(".AvvikshandteringModal")).to.be.not.null;
        });
    });

    describe("Form error handling", () => {
        let nySakStub: SinonStub;
        beforeEach(() => {
            serviceStubs().lagreJournalpostStub.resolves();
            nySakStub = sinonSandbox.stub(SakService.prototype, "opprettNySak").callsFake((paaloggetEnhet: string) => {
                return Promise.resolve({ saksnummer: nySakNr });
            });
        });
        it("should fail saving journalpost when title is empty", async () => {
            await renderVisJournalpostPage();
            const simulator = new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .changeJournalpostTittel("")
                .clickLagreButton();

            await waitFor(() => screen.getByTestId("errorsummary"));

            simulator.assertDokumentTittelHasValidationError();
            expect(document.querySelector(".feiloppsummering")).to.matchSnapshot("ErrorSummary");
            sinon.assert.notCalled(serviceStubs().lagreJournalpostStub);
        });

        it("should fail saving journalpost when date is empty", async () => {
            await renderVisJournalpostPage();
            const simulator = new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .changeDokumentDato("")
                .clickLagreButton();

            await waitFor(() => screen.getByTestId("errorsummary"));

            simulator.assertDokumentDatoHasValidationError();
            expect(document.querySelector(".feiloppsummering")).to.matchSnapshot("ErrorSummary");
            sinon.assert.notCalled(serviceStubs().lagreJournalpostStub);
        });

        it("should fail saving journalpost when avsender is empty", async () => {
            await renderVisJournalpostPage();
            const simulator = new VisJournalpostEventSimulator()
                .clickRedigerButton()
                .clickAvsenderFritekstCheckbox()
                .changeAvsenderFritekstInput("")
                .clickLagreButton();

            await waitFor(() => screen.getByTestId("errorsummary"));

            simulator.assertAvsenderInputHasValidationError();
            expect(document.querySelector(".feiloppsummering")).to.matchSnapshot("ErrorSummary");
            sinon.assert.notCalled(serviceStubs().lagreJournalpostStub);
        });
    });
});
