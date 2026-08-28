import { DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { AapneDokumentKnapp } from "@bidrag/common";
import { ExternalLinkIcon as ExternalLink } from "@navikt/aksel-icons";
import { useQueryClient } from "@tanstack/react-query";

import { DOKUMENT_KAN_IKKE_ÅPNES_STATUS, type DokumentStatus } from "../../constants/DokumentStatus";
import type { IJournalpostStatus } from "../../types/Journalpost";
import EditDocumentButton from "./EditDocumentButton";

interface IOpenDokumentButtonProps {
    dokumentreferanse?: string;
    journalpostId?: string;
    status?: DokumentStatus | string | IJournalpostStatus;
    erSkjema?: boolean;
}
export default function OpenDokumentButton({
    dokumentreferanse,
    status,
    journalpostId,
    erSkjema,
}: IOpenDokumentButtonProps) {
    const queryClient = useQueryClient();
    if (DOKUMENT_KAN_IKKE_ÅPNES_STATUS.includes(status as DokumentStatus | IJournalpostStatus)) {
        return null;
    }
    if (status === "MÅ_KONTROLLERES" || status === "KONTROLLERT") {
        return (
            <EditDocumentButton
                journalpostId={journalpostId}
                dokumentreferanse={dokumentreferanse}
                erSkjema={erSkjema}
                onEditFinished={() => queryClient.invalidateQueries({ queryKey: ["forsendelse"] })}
            />
        );
    }

    if (!journalpostId || !dokumentreferanse) return null;

    // Alle statuser som når hit (unntatt MÅ_KONTROLLERES/KONTROLLERT over, og de som filtreres bort av
    // DOKUMENT_KAN_IKKE_ÅPNES_STATUS) kan åpnes direkte, på samme måte som i JournalpostTabell.
    return (
        <AapneDokumentKnapp
            journalpostId={journalpostId}
            dokumentreferanse={dokumentreferanse}
            status={DokumentStatusDto.FERDIGSTILT}
            variant="ikon"
            tittel="Åpne dokument"
        >
            <ExternalLink />
        </AapneDokumentKnapp>
    );
}
