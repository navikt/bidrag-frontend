export interface DokumentISak {
    dokumentreferanse: string;
    tittel: string;
    brevkode: string;
    dokumentdato: string;
}

export interface JournalpostISak {
    journalpostId: string;
    journaldato: string;
    dokumenter: DokumentISak[];
}
