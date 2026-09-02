import _ from "lodash";

import { RegistrerJournalpostRequest } from "../../../../types/api/JournalpostTypes";
import { FAGOMRADE } from "../../../../types/enum/Fagomrade";
import type { JournalpostToRegister } from "./JournalpostToRegister";

export function mapToReqistrerJournalpostRequest(
    journalfortDato: string,
    journalpostToRegister: JournalpostToRegister,
    fagomrade?: string,
): RegistrerJournalpostRequest {
    const registrerJournalpostRequest = new RegistrerJournalpostRequest(journalpostToRegister.journalpostId);
    const endreDokumenter = journalpostToRegister.endreDokumenter.filter((e) => e !== undefined);
    registrerJournalpostRequest.journalforendeEnhet = journalpostToRegister.journalforendeEnhet;
    registrerJournalpostRequest.tittel = endreDokumenter.length > 0 ? endreDokumenter[0].tittel : undefined;
    registrerJournalpostRequest.dokumentDato = journalpostToRegister.mottatDato;
    registrerJournalpostRequest.tilknyttSaker = _.uniq(journalpostToRegister.tilknyttSaker);
    registrerJournalpostRequest.journaldato = journalfortDato;
    registrerJournalpostRequest.endreDokumenter = endreDokumenter;
    registrerJournalpostRequest.fagomrade =
        fagomrade === FAGOMRADE.BID || fagomrade === FAGOMRADE.FAR ? fagomrade : FAGOMRADE.BID;
    registrerJournalpostRequest.gjelder = journalpostToRegister.gjelderIdent;
    registrerJournalpostRequest.avsenderNavn = journalpostToRegister.avsenderNavn?.trim();
    return registrerJournalpostRequest;
}
