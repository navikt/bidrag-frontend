import type { BestemKanalResponseDistribusjonskanalEnum } from "@bidrag/api/BidragDokumentArkivApi";

import type { EttersendingsoppgaveDto, ForsendelseResponsTo } from "@bidrag/api/BidragForsendelseApi";
import type { AxiosResponse } from "axios";
import type { VarselDokumentType } from "../pages/forsendelse/context/DokumenterFormContext";

export function mapVarselEttersendelse(ettersendingsoppgave: EttersendingsoppgaveDto) {
    return (
        ettersendingsoppgave && {
            tittel: ettersendingsoppgave.tittel,
            journalpostId: ettersendingsoppgave.ettersendelseForJournalpostId,
            innsendingsfristDager: ettersendingsoppgave.innsendingsfristDager,
            vedleggsliste: ettersendingsoppgave.vedleggsliste?.map((d) => ({
                ...d,
                varselDokumentId: d.id,
                type: (d.skjemaId ? "SKJEMA" : "FRITEKST") as VarselDokumentType,
            })),
        }
    );
}

export function mapForsendelseResponse(ettersendingsoppgave: EttersendingsoppgaveDto) {
    return (prev: AxiosResponse<ForsendelseResponsTo>) => {
        return {
            ...prev,
            ettersendingsoppgave: ettersendingsoppgave,
        };
    };
}
export function mapToDistribusjonKanalBeskrivelse(distribusjonKanal: BestemKanalResponseDistribusjonskanalEnum) {
    switch (distribusjonKanal) {
        case "PRINT":
            return "Fysisk (Sentral print)";
        case "SDP":
            return "Digitalt (Digital postkasse)";
        case "DITT_NAV":
            return "Digitalt (Nav.no)";
    }
}
