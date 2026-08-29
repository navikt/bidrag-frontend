import { AapneDokumentKnapp } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
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

    return (
        <AapneDokumentKnapp
            journalpostId={journalpostId}
            dokumentreferanse={dokumentreferanse}
            status={status}
            variant="ikon"
            tittel="Åpne dokument"
        >
            <ExternalLinkIcon />
        </AapneDokumentKnapp>
    );
}
