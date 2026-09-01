import type {
    AvsenderMottakerDto,
    DokumentDto,
    DokumentType,
    JournalpostDto,
    JournalpostKanal,
    JournalpostResponse,
    JournalStatus,
    ReturDetaljerLoggDto,
    Sakstilknytning,
} from "../../types/api/JournalpostTypes";

export class JournalpostResponseBuilder {
    static get Builder() {
        let journalpost: JournalpostDto;
        const sakstilknytninger: Sakstilknytning[] = [];
        class Builder {
            constructor(journalpostId: string) {
                journalpost = {
                    journalpostId,
                    dokumenter: [],
                } as JournalpostDto;
            }

            withSakstilknytning(sakstilknytning: Sakstilknytning) {
                sakstilknytninger.push(sakstilknytning);
                return this;
            }
            withDokument(dokument: DokumentDto) {
                journalpost.dokumenter.push(dokument);
                return this;
            }

            withReturDetaljer(returDato?: string, antall?: number, returLogg?: ReturDetaljerLoggDto[]) {
                journalpost.returDetaljer = {
                    dato: returDato,
                    antall: antall ?? 1,
                    logg: returLogg ?? [],
                };
                return this;
            }

            withMottatDato(mottattDato: string) {
                journalpost.mottattDato = mottattDato;
                return this;
            }

            withInnhold(innhold: string) {
                journalpost.innhold = innhold;
                return this;
            }

            withJournalforendeEnhet(journalforendeEnhet: string) {
                journalpost.journalforendeEnhet = journalforendeEnhet;
                return this;
            }

            withJournalfortAv(journalfortAv: string) {
                journalpost.journalfortAv = journalfortAv;
                return this;
            }

            withAvsenderNavn(avsenderNavn: string) {
                journalpost.avsenderNavn = avsenderNavn;
                return this;
            }

            withAvsender(avsender: AvsenderMottakerDto) {
                journalpost.avsenderMottaker = avsender;
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

            withGjelderAktor(ident: string) {
                journalpost.gjelderAktor = {
                    ident,
                    type: "FNR",
                };
                return this;
            }

            build(): JournalpostResponse {
                return { journalpost: { ...journalpost }, sakstilknytninger };
            }
        }

        return Builder;
    }
}
