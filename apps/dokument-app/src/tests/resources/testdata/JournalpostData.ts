import {
    type DokumentDto,
    type EndreDokument,
    type EndreReturDetaljer,
    type JournalpostDto,
    LagreJournalpostRequest,
    type ReturDetaljerDto,
} from "../../../types/api/JournalpostTypes";
import { DokumentType, JournalpostKanal, JournalpostMapper, JournalStatus } from "../../../types/journalpost";
import { JOURNALPOST_ID_JOURNALFOERT } from "../../mockdata/journalpostMockData";
import { AVSENDER_NAVN, DOKUMENT_DATO, JOURNAL_DATO, JOURNALFORENDE_TITTEL } from "./index";

export const journalpostDataEnkel: JournalpostDto = {
    avsenderNavn: "Avsender Avsendersem",
    avsenderMottaker: {
        navn: "Avsender Avsendersem",
        ident: "12323123213",
        type: "FNR",
    },
    dokumenter: [{ dokumentreferanse: "3808333758", dokumentType: DokumentType.I, tittel: "" }],
    dokumentDato: null,
    fagomrade: "BID",
    gjelderAktor: null,
    innhold: "",
    kanal: JournalpostKanal.NAV_NO,
    journalforendeEnhet: "4815",
    journalfortAv: "",
    journalfortDato: "2021-03-02",
    journalpostId: "BID-38083337",
    mottattDato: "2021-03-02",
    dokumentType: DokumentType.I,
    journalstatus: JournalStatus.MOTTAT,
    feilfort: null,
    brevkode: null,
};

export default class JournalpostBuilder {
    static get Builder() {
        let journalpost: JournalpostDto;
        let sakstilknytninger: string[] = [];

        class Builder {
            constructor(journalpostId: string) {
                journalpost = {
                    journalpostId,
                    dokumenter: [],
                } as JournalpostDto;
            }

            withInnhold(innhold: string) {
                journalpost.innhold = innhold;
                return this;
            }

            withJournalforendeEnhet(journalforendeEnhet: string) {
                journalpost.journalforendeEnhet = journalforendeEnhet;
                return this;
            }

            withAvsenderNavn(avsenderNavn: string) {
                journalpost.avsenderNavn = avsenderNavn;
                journalpost.avsenderMottaker = {
                    navn: avsenderNavn,
                    ident: "313213123",
                    type: "FNR",
                };
                return this;
            }

            withKilde(kilde: JournalpostKanal) {
                journalpost.kilde = kilde;
                journalpost.kanal = kilde;
                return this;
            }

            withFagomrade(fagomrade: string) {
                journalpost.fagomrade = fagomrade;
                return this;
            }

            withJournaldato(journalDato: string) {
                journalpost.journalfortDato = journalDato;
                return this;
            }

            withDokumentdato(dokumentDato: string) {
                journalpost.dokumentDato = dokumentDato;
                journalpost.mottattDato = dokumentDato;
                return this;
            }

            withDokumenttype(dokumenttype: DokumentType) {
                journalpost.dokumentType = dokumenttype;
                return this;
            }

            withJournalstatus(journalstatus: JournalStatus) {
                journalpost.journalstatus = journalstatus;
                return this;
            }

            withSakstilknytninger(saker: string[]) {
                sakstilknytninger = saker;
                return this;
            }

            withGjelderAktor(ident: string) {
                journalpost.gjelderAktor = {
                    ident,
                    type: "FNR",
                };
                return this;
            }

            withDokumenter(dokumentDtos: DokumentDto[]) {
                journalpost.dokumenter = dokumentDtos;
                return this;
            }

            withReturDetaljer(returDetaljer: ReturDetaljerDto) {
                journalpost.returDetaljer = returDetaljer;
                return this;
            }

            build() {
                return new JournalpostMapper(journalpost, undefined, sakstilknytninger).map();
            }
        }

        return Builder;
    }
}

export class LagreJournalpostBuilder {
    private lagreJournalpostDto: LagreJournalpostRequest = new LagreJournalpostRequest(JOURNALPOST_ID_JOURNALFOERT);

    constructor(tilknyttSaker?: string[]) {
        this.lagreJournalpostDto.tittel = JOURNALFORENDE_TITTEL;
        this.lagreJournalpostDto.journaldato = JOURNAL_DATO;
        this.lagreJournalpostDto.dokumentDato = DOKUMENT_DATO;
        this.lagreJournalpostDto.tilknyttSaker = tilknyttSaker;
        this.lagreJournalpostDto.avsenderNavn = AVSENDER_NAVN;
    }

    withJournalpostId(jpId: string) {
        this.lagreJournalpostDto.journalpostId = jpId;
        return this;
    }
    withTittel(tittel: string) {
        if (tittel == null) {
            delete this.lagreJournalpostDto.tittel;
        } else {
            this.lagreJournalpostDto.tittel = tittel;
        }
        return this;
    }

    withJournaldato(journalDato: string) {
        this.lagreJournalpostDto.journaldato = journalDato;
        return this;
    }

    withDokumentDato(dokumentDato: string) {
        if (dokumentDato == null) {
            delete this.lagreJournalpostDto.dokumentDato;
        } else {
            this.lagreJournalpostDto.dokumentDato = dokumentDato;
        }
        return this;
    }

    withTilknyttSaker(saker: string[]) {
        this.lagreJournalpostDto.tilknyttSaker = saker;
        return this;
    }

    withAvsenderNavn(avsenderNavn: string) {
        this.lagreJournalpostDto.avsenderNavn = avsenderNavn;
        return this;
    }

    withDokument(dokument: EndreDokument) {
        if (!this.lagreJournalpostDto.endreDokumenter) {
            this.lagreJournalpostDto.endreDokumenter = [];
        }
        this.lagreJournalpostDto.endreDokumenter.push(dokument);
        return this;
    }

    withReturDetaljer(returDetaljer: EndreReturDetaljer) {
        if (!this.lagreJournalpostDto.endreReturDetaljer) {
            this.lagreJournalpostDto.endreReturDetaljer = [];
        }
        this.lagreJournalpostDto.endreReturDetaljer.push(returDetaljer);
        return this;
    }

    build() {
        return this.lagreJournalpostDto;
    }
}
