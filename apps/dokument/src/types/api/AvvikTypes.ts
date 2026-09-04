export enum AvvikType {
    BESTILL_ORIGINAL = "BESTILL_ORIGINAL",
    BESTILL_RESKANNING = "BESTILL_RESKANNING",
    BESTILL_SPLITTING = "BESTILL_SPLITTING",
    KOPIER_FRA_ANNEN_FAGOMRADE = "KOPIER_FRA_ANNEN_FAGOMRADE",
    ENDRE_FAGOMRADE = "ENDRE_FAGOMRADE",
    SEND_TIL_FAGOMRADE = "SEND_TIL_FAGOMRADE",
    INNG_TIL_UTG_DOKUMENT = "INNG_TIL_UTG_DOKUMENT",
    FEILFORE_SAK = "FEILFORE_SAK",
    SLETT_JOURNALPOST = "SLETT_JOURNALPOST",
    TREKK_JOURNALPOST = "TREKK_JOURNALPOST",
    OVERFOR_TIL_ANNEN_ENHET = "OVERFOR_TIL_ANNEN_ENHET",
    REGISTRER_RETUR = "REGISTRER_RETUR",
    BESTILL_NY_DISTRIBUSJON = "BESTILL_NY_DISTRIBUSJON",
    FARSKAP_UTELUKKET = "FARSKAP_UTELUKKET",
    MANGLER_ADRESSE = "MANGLER_ADRESSE",
}

export interface SendAvvikResponse {
    avvikType: AvvikType;
    oppgaveId: string;
    oppgavetype: string;
    tema: string;
    tildeltEnhetsnr: string;
}

export class AvvikURLBuilder {
    url?: string;
    jpId?: string;
    enhetsnummer?: string;
    saksnummer?: string;
    avvikType?: string;
    paloggetEnhet?: string;

    constructor(baseUrl?: string) {
        this.url = baseUrl;
    }

    builder() {
        return this;
    }

    withJpId(jpId: string) {
        this.jpId = jpId;
        return this;
    }

    withEnhetsnummer(enhetsnummer: string) {
        this.enhetsnummer = enhetsnummer;
        return this;
    }

    withSaksnummer(saksnummer: string) {
        this.saksnummer = saksnummer;
        return this;
    }

    withTypeAvvik(avvikType: string) {
        this.avvikType = avvikType;
        return this;
    }
    withPaloggetEnhet(enhet: string) {
        this.paloggetEnhet = enhet;
        return this;
    }
    buildForConsumer() {
        let url = `/journal/${this.jpId}/avvik`;
        if (this.saksnummer) {
            url += `?saksnummer=${this.saksnummer}`;
        }
        return url;
    }
}
