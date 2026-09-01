import {
    DokumentType,
    JournalpostKanal,
    type JournalpostResponse,
    JournalStatus,
} from "../../types/api/JournalpostTypes";
import { JournalpostResponseBuilder } from "../builders/JournalpostBuilder";
import { PERSON_ID_1, PERSON_ID_4 } from "./personMockData";
import { SAKSNUMMER_3, SAKSNUMMER_NO_ACCESS } from "./sakMockData";
import type { ResponseData } from "./types";

export const JOURNALPOST_TEST_ENHET = "4817";
export const JOURNALPOST_ID_TEST = "BID-100000";
export const JOURNALPOST_ID_ERR = "BID-666";
export const JOURNALPOST_ID_1 = "BID-200000";
export const JOURNALPOST_ID_JOARK_1 = "JOARK-200000";
export const JOURNALPOST_ID_JOARK_2 = "JOARK-200001";
export const JOURNALPOST_ID_1_UTGAAENDE = "BID-200002";
export const JOURNALPOST_ID_1_UTGAAENDE_KLAR_TIL_PRINT = "BID-200009";
export const JOURNALPOST_ID_1_UTGAAENDE_WITH_RETUR = "BID-200003";
export const JOURNALPOST_ID_2_UTGAAENDE_WITH_RETUR = "JOARK-200003";
export const JOURNALPOST_ID_NO_PERSON = "BID-200001";
export const JOURNALPOST_ID_JOURNALFOERT = "BID-300000";
export const JOURNALPOST_ID_JOURNALFOERT_JOARK_WITH_SAK = "JOARK-300001";
export const JOURNALPOST_ID_JOURNALFOERT_WITH_SAK = "BID-300001";
export const JOURNALPOST_ID_NO_ACCESS = "BID-400000";

export const avvikMockDataMap: Map<string, ResponseData<string[]>> = new Map([
    [
        JOURNALPOST_ID_TEST,
        {
            status: 200,
            data: [
                "SLETT_JOURNALPOST",
                "TREKK_JOURNALPOST",
                "ENDRE_FAGOMRADE",
                "FEILFORE_SAK",
                "INNG_TIL_UTG_DOKUMENT",
                "SEND_TIL_FAGOMRADE",
                "BESTILL_ORIGINAL",
                "BESTILL_RESKANNING",
                "BESTILL_SPLITTING",
                "OVERFOR_TIL_ANNEN_ENHET",
                "REGISTRER_RETUR",
                "BESTILL_NY_DISTRIBUSJON",
                "MANGLER_ADRESSE",
            ],
        },
    ],
    [
        JOURNALPOST_ID_1,
        {
            status: 200,
            data: ["INNG_TIL_UTG_DOKUMENT", "ENDRE_FAGOMRADE", "TREKK_JOURNALPOST", "OVERFOR_TIL_ANNEN_ENHET"],
        },
    ],
    [
        JOURNALPOST_ID_JOURNALFOERT,
        {
            status: 200,
            data: [
                "BESTILL_ORIGINAL",
                "BESTILL_RESKANNING",
                "BESTILL_SPLITTING",
                "INNG_TIL_UTG_DOKUMENT",
                "FEILFORE_SAK",
                "ENDRE_FAGOMRADE",
            ],
        },
    ],
    [
        JOURNALPOST_ID_JOURNALFOERT_JOARK_WITH_SAK,
        {
            status: 200,
            data: ["FEILFORE_SAK", "ENDRE_FAGOMRADE"],
        },
    ],
]);
export const journalpostMap: Map<string, ResponseData<JournalpostResponse>> = new Map([
    [
        JOURNALPOST_ID_ERR,
        {
            status: 500,
            errorMessage: `Kunne ikke hente journalpost med id ${JOURNALPOST_ID_ERR}`,
            data: null,
        },
    ],
    [
        JOURNALPOST_ID_TEST,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_TEST)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet(JOURNALPOST_TEST_ENHET)
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.I, tittel: "" })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_TEST,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_TEST)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet(JOURNALPOST_TEST_ENHET)
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.I, tittel: "" })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_JOARK_2,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_JOARK_2)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({
                    dokumentreferanse: "3835614465",
                    dokumentType: DokumentType.I,
                    tittel: "Tittel på hoveddokument",
                })
                .withDokument({
                    dokumentreferanse: "3835614466",
                    dokumentType: DokumentType.I,
                    tittel: "Tittel på vedlegg",
                })
                .withDokument({
                    dokumentreferanse: "38335614467",
                    dokumentType: DokumentType.I,
                    tittel: "Tittel på vedlegg 2",
                })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_JOARK_1,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_JOARK_1)
                .withAvsenderNavn("Avsender Nansen")
                .withAvsender({
                    navn: "Avsender Nansen",
                    ident: PERSON_ID_1,
                    type: "FNR",
                })
                .withKilde(JournalpostKanal.NAV_NO)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({
                    dokumentreferanse: "3835614465",
                    dokumentType: DokumentType.I,
                    tittel: "Tittel på hoveddokument",
                })
                .withDokument({
                    dokumentreferanse: "3835614466",
                    dokumentType: DokumentType.I,
                    tittel: "Tittel på vedlegg",
                })
                .withDokument({
                    dokumentreferanse: "38335614467",
                    dokumentType: DokumentType.I,
                    tittel: "Tittel på vedlegg 2",
                })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_1,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_1)
                .withAvsenderNavn("Avsender Nansen")
                .withAvsender({
                    navn: "Avsender Nansen",
                    ident: PERSON_ID_1,
                    type: "FNR",
                })
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.I, tittel: "" })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_1_UTGAAENDE,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_1_UTGAAENDE)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.U)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.U, tittel: "" })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_1_UTGAAENDE_KLAR_TIL_PRINT,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_1_UTGAAENDE_KLAR_TIL_PRINT)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.KLAR_TIL_PRINT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.U)
                .withJournalforendeEnhet("4817")
                .withInnhold("Fritekstbrev")
                .withJournalfortAv("Hans Hansen")
                .withDokumentdato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.U, tittel: "" })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_2_UTGAAENDE_WITH_RETUR,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_2_UTGAAENDE_WITH_RETUR)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withInnhold("Tittel på dokument")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.U)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.U, tittel: "" })
                .withReturDetaljer(undefined, 2, [
                    {
                        dato: undefined,
                        beskrivelse:
                            "Dette er en lang beskrivlse. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut porta feugiat enim eget condimentum. Mauris tempor diam justo, id sodales libero vulputate in. Suspendisse malesuada ligula vehicula lorem facilisis, ut tincidunt magna interdum. Fusce euismod ipsum eu tincidunt blandit. Donec et nunc quam. Ut ipsum eros, mollis ac tortor ultrices, elementum interdum urna. Mauris ac tortor non orci convallis egestas non hendrerit turpis. Curabitur posuere eget urna tristique finibus. Praesent non urna elit. Vestibulum sed elit sit amet nunc mollis suscipit. Sed faucibus sollicitudin enim, vel venenatis justo varius eu. Duis non iaculis nulla. Proin leo leo, blandit vitae mi eget, fermentum tempus dolor. Sed semper mi volutpat, congue ligula vestibulum, pharetra quam. Maecenas dignissim varius metus. Cras facilisis lectus id neque congue, eget tincidunt erat bibendum.",
                    },
                ])
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_1_UTGAAENDE_WITH_RETUR,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_1_UTGAAENDE_WITH_RETUR)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withGjelderAktor(PERSON_ID_1)
                .withFagomrade("BID")
                .withInnhold("Tittel på dokument")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.U)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.U, tittel: "" })
                .withReturDetaljer("2020-01-05", 5, [
                    {
                        dato: "2021-05-05",
                        beskrivelse:
                            "Dette er en lang beskrivlse. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut porta feugiat enim eget condimentum. Mauris tempor diam justo, id sodales libero vulputate in. Suspendisse malesuada ligula vehicula lorem facilisis, ut tincidunt magna interdum. Fusce euismod ipsum eu tincidunt blandit. Donec et nunc quam. Ut ipsum eros, mollis ac tortor ultrices, elementum interdum urna. Mauris ac tortor non orci convallis egestas non hendrerit turpis. Curabitur posuere eget urna tristique finibus. Praesent non urna elit. Vestibulum sed elit sit amet nunc mollis suscipit. Sed faucibus sollicitudin enim, vel venenatis justo varius eu. Duis non iaculis nulla. Proin leo leo, blandit vitae mi eget, fermentum tempus dolor. Sed semper mi volutpat, congue ligula vestibulum, pharetra quam. Maecenas dignissim varius metus. Cras facilisis lectus id neque congue, eget tincidunt erat bibendum.",
                    },
                    {
                        dato: "2019-05-05",
                        beskrivelse: "dette er kort beskrivelse",
                    },
                ])
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_NO_PERSON,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_NO_PERSON)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO_BID)
                .withJournalstatus(JournalStatus.MOTTAT)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "3835614465", dokumentType: DokumentType.I, tittel: "" })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_JOURNALFOERT,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_JOURNALFOERT)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.SKAN_BID)
                .withJournalstatus(JournalStatus.JOURNALFOERT)
                .withInnhold("Klage på bidrag")
                .withDokumentdato("2021-06-25")
                .withJournalfortAv("Bamble Bamsen")
                .withGjelderAktor(PERSON_ID_4)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "4835614465", dokumentType: DokumentType.I, tittel: "" })
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_JOURNALFOERT_WITH_SAK,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_JOURNALFOERT_WITH_SAK)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.SKAN_BID)
                .withJournalstatus(JournalStatus.JOURNALFOERT)
                .withInnhold("Klage på bidrag med saker")
                .withDokumentdato("2021-06-25")
                .withGjelderAktor(PERSON_ID_4)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet("4817")
                .withMottatDato("2021-06-25")
                .withDokument({ dokumentreferanse: "4835614465", dokumentType: DokumentType.I, tittel: "" })
                .withSakstilknytning(SAKSNUMMER_3)
                .withSakstilknytning(SAKSNUMMER_NO_ACCESS)
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_JOURNALFOERT_JOARK_WITH_SAK,
        {
            status: 200,
            data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_JOURNALFOERT_JOARK_WITH_SAK)
                .withAvsenderNavn("Avsender Nansen")
                .withKilde(JournalpostKanal.NAV_NO)
                .withJournalstatus(JournalStatus.JOURNALFOERT)
                .withInnhold("Klage på bidrag med saker")
                .withDokumentdato("2021-06-25")
                .withGjelderAktor(PERSON_ID_4)
                .withFagomrade("BID")
                .withJournaldato("2021-06-25")
                .withDokumenttype(DokumentType.I)
                .withJournalforendeEnhet("4806")
                .withMottatDato("2021-06-25")
                .withDokument({
                    dokumentreferanse: "4835614465",
                    dokumentType: DokumentType.I,
                    tittel: "Titttel på hoveddokument",
                })
                .withDokument({
                    dokumentreferanse: "4835614466",
                    dokumentType: DokumentType.I,
                    tittel: "Tittel på vedlegg",
                })
                .withSakstilknytning(SAKSNUMMER_3)
                .build(),
        },
    ],
    [
        JOURNALPOST_ID_NO_ACCESS,
        { status: 403, data: new JournalpostResponseBuilder.Builder(JOURNALPOST_ID_NO_ACCESS).build() },
    ],
]);
