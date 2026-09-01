import { expect } from "chai";
import { describe } from "mocha";
import {
    UpdateJournalpost,
    type UpdateJournalpostFormValues,
} from "../../../pages/visjournalpost/context/VisJournalpostProvider";
import {
    type DokumentDto,
    DokumentType,
    JournalpostKanal,
    JournalStatus,
    type ReturDetaljerDto,
} from "../../../types/api/JournalpostTypes";
import {
    AVSENDER_NAVN,
    DOKUMENT_DATO,
    JOURNAL_DATO,
    JOURNALFORENDE_ENHET,
    JOURNALFORENDE_TITTEL,
    PERSON_IDENT,
} from "../../resources/testdata";
import JournalpostBuilder from "../../resources/testdata/JournalpostData";

const saknr1 = "12345";
const saknr2 = "22345";
const createJournalpost = (journalpostId: string, dokumenter: DokumentDto[] = [], returDetaljer?: ReturDetaljerDto) =>
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

const JOURNALPOST_TITTEL = "JP tittel";
const HOVEDDOK_TITTEL = "HOVEDDOK tittel";
const HOVEDDOK_ID = "213213";
const DOK_DATO = "05-05-2020";
const TILKNYTT_SAKER = ["123213", "123123"];
describe("VisJournalpostPage", () => {
    it("Should create lagrejournalpost request", () => {
        const journalpost = createJournalpost("JOARK-123213", [
            {
                dokumentreferanse: HOVEDDOK_ID,
                tittel: "123213",
            },
        ]);
        const formData = createEndreJournalpostFormValues();
        const lagreJournalpostRequest = new UpdateJournalpost(formData, journalpost).toLagreJournalpostRequest();

        expect(lagreJournalpostRequest.tittel).to.be.eq(JOURNALPOST_TITTEL);
        expect(lagreJournalpostRequest.dokumentDato).to.be.eq(DOK_DATO);
        expect(lagreJournalpostRequest.avsenderNavn).to.be.eq(AVSENDER_NAVN);
        expect(lagreJournalpostRequest.tilknyttSaker).to.deep.eq(TILKNYTT_SAKER);
    });

    it("Should update tittel on bidrag journalpost", () => {
        const journalpost = createJournalpost("JOARK-123213", [
            {
                dokumentreferanse: HOVEDDOK_ID,
                tittel: "123213",
            },
        ]);
        journalpost.isJoarkJournalpost = false;
        const formData = createEndreJournalpostFormValues();
        const lagreJournalpostRequest = new UpdateJournalpost(formData, journalpost).toLagreJournalpostRequest();

        expect(lagreJournalpostRequest.tittel).to.be.eq(JOURNALPOST_TITTEL);
    });

    it("Should update tittel on utgående bidrag journalpost", () => {
        const journalpost = createJournalpost("JOARK-123213", [
            {
                dokumentreferanse: HOVEDDOK_ID,
                tittel: "123213",
            },
        ]);
        journalpost.isJoarkJournalpost = false;
        journalpost.isUtgaaende = false;
        const formData = createEndreJournalpostFormValues();
        const lagreJournalpostRequest = new UpdateJournalpost(formData, journalpost).toLagreJournalpostRequest();

        expect(lagreJournalpostRequest.tittel).to.be.eq(JOURNALPOST_TITTEL);
    });

    it("Should update journalpost tittel to hoveddokument tittel on joark journalpost", () => {
        const journalpost = createJournalpost("JOARK-123213", [
            {
                dokumentreferanse: HOVEDDOK_ID,
                tittel: "123213",
            },
        ]);
        journalpost.isJoarkJournalpost = true;
        journalpost.isUtgaaende = false;
        const formData = createEndreJournalpostFormValues();
        formData.tittel = null;
        const lagreJournalpostRequest = new UpdateJournalpost(formData, journalpost).toLagreJournalpostRequest();

        expect(lagreJournalpostRequest.tittel).to.be.eq(HOVEDDOK_TITTEL);
    });

    it("Should not update tittel on utgaaende and ferdigstilt joark journalpost", () => {
        const journalpost = createJournalpost("JOARK-123213", [
            {
                dokumentreferanse: HOVEDDOK_ID,
                tittel: "123213",
            },
        ]);
        journalpost.isJoarkJournalpost = true;
        journalpost.isUtgaaende = true;
        journalpost.journalstatus = JournalStatus.FERDIGSTILT;
        const formData = createEndreJournalpostFormValues();
        const lagreJournalpostRequest = new UpdateJournalpost(formData, journalpost).toLagreJournalpostRequest();

        expect(lagreJournalpostRequest.tittel).to.be.undefined;
    });

    it("Should not update tittel on utgaaende and ekspedert joark journalpost", () => {
        const journalpost = createJournalpost("JOARK-123213", [
            {
                dokumentreferanse: HOVEDDOK_ID,
                tittel: "123213",
            },
        ]);
        journalpost.isJoarkJournalpost = true;
        journalpost.isUtgaaende = true;
        journalpost.journalstatus = JournalStatus.EKSPEDERT;
        const formData = createEndreJournalpostFormValues();
        const lagreJournalpostRequest = new UpdateJournalpost(formData, journalpost).toLagreJournalpostRequest();

        expect(lagreJournalpostRequest.tittel).to.be.undefined;
    });

    function createEndreJournalpostFormValues(): UpdateJournalpostFormValues {
        return {
            tittel: JOURNALPOST_TITTEL,
            avsenderNavn: AVSENDER_NAVN,
            dokumentDato: DOK_DATO,
            tilknyttSaker: TILKNYTT_SAKER,
            endreDokumenter: [
                {
                    dokId: HOVEDDOK_ID,
                    tittel: HOVEDDOK_TITTEL,
                },
                {
                    dokId: "123333",
                    tittel: "Vedlegg tittel",
                },
            ],
            endreReturDetaljer: [],
        };
    }
});
