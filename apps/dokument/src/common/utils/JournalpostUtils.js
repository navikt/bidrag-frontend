import _ from "lodash";

import { formatDate } from "./DateUtils";

export default class JournalpostUtils {
    static getSanifiedJournalpost(journalpostToSanifiy) {
        let sanifiedJournalpost = _.omit(journalpostToSanifiy, [
            "dokumenter_fake",
            "tjenester",
            "bidragssaker",
            "dokumenter",
        ]);
        sanifiedJournalpost.gjelder = sanifiedJournalpost.gjelderAktor.ident;
        sanifiedJournalpost.beskrivelse = sanifiedJournalpost.innhold;
        sanifiedJournalpost.journaldato = formatDate(sanifiedJournalpost.journalfortDato, "YYYY-MM-DD");
        sanifiedJournalpost.dokumentDato = formatDate(sanifiedJournalpost.dokumentDato, "YYYY-MM-DD");
        sanifiedJournalpost.journalpostId = parseInt(sanifiedJournalpost.journalpostId.match(/\d+/), 10);
        sanifiedJournalpost.saksnummer = {
            erTilknyttetNySak: false,
            saksnummer: sanifiedJournalpost.saksnummer,
            saksnummerSomSkalErstattes: sanifiedJournalpost.saksnummer,
        };
        sanifiedJournalpost = _.omit(sanifiedJournalpost, [
            "fagomrade",
            "innhold",
            "journalforendeEnhet",
            "journalfortAv",
            "journalfortDato",
            "mottattDato",
            "gjelderAktor",
        ]);
        return sanifiedJournalpost;
    }

    static visRolleForEnkelJournalpost(fnr, sak) {
        if (!fnr || !sak.roller) {
            return "N/A";
        }
        const rolle = sak.roller.find((rolle) => rolle.foedselsnummer === fnr);
        if (!rolle) {
            return null;
        }
        return <span className={`rolleTag ${rolle.rolleType}`}>{rolle.rolleType}</span>;
    }

    static tellAntallVedleggForEnkeljournalpost(dokumenter) {
        return `(${dokumenter.length})`;
    }

    static hentLinkTilJournalpost(jid, saksnummer, paloggetenhet) {
        if (jid && jid.length > 7) {
            if (jid.substring(0, 4) !== "BID-" && jid.charAt(0) >= "0" && jid.charAt(0) <= "9") {
                jid = `BID-${jid}`;
            }
            return `/sak/${saksnummer}/journal/${jid}/?enhet=${paloggetenhet}`;
        }
        return "";
    }

    static findDokumentTypeTekst(dokumentTypeKode) {
        switch (dokumentTypeKode) {
            case "U":
                return <span>&larr; Utgående</span>;
            case "X":
                return "Notat";
            case "I":
                return <span>&rarr; Inngående</span>;
            default:
                return dokumentTypeKode;
        }
    }

    static findJournalStatusBeskrivelse(journalstatusKode) {
        const journalStatusMap = {
            A: "Avsluttet",
            D: "Under prod.",
            J: "Journalført",
            M: "Mottaksreg.",
            O: "Opprettet",
            R: "Reservert",
            T: "Til lagring",
            U: "Utgår",
        };
        if (!journalstatusKode || !journalStatusMap[journalstatusKode]) {
            return journalstatusKode;
        }
        return journalStatusMap[journalstatusKode];
    }
}
