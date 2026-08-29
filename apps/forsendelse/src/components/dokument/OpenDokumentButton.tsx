import { OpenDocumentUtils } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";

import { DOKUMENT_KAN_IKKE_ÅPNES_STATUS, DokumentStatus } from "../../constants/DokumentStatus";
import { IJournalpostStatus } from "../../types/Journalpost";
import EditDocumentButton from "./EditDocumentButton";
import {AapneDokumentKnapp} from "@bidrag/common";
import {DokumentStatusDto} from "@bidrag/api/BidragDokumentApi";

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
    const [isOpeningIframe, setIsOpeningIframe] = useState(false);
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

    const id = `doklink_${journalpostId}_${dokumentreferanse}`;
    function openDocumentIframe() {
        setIsOpeningIframe(true);
        document.getElementById(id).click();
        setTimeout(() => {
            setIsOpeningIframe(false);
        }, 4000);
    }
    if (status == "UNDER_REDIGERING") {
        return (
            <>
                <Button
                    as="span"
                    size={"small"}
                    variant={"tertiary"}
                    icon={<ExternalLinkIcon />}
                    loading={isOpeningIframe}
                    disabled={isOpeningIframe}
                    title={isOpeningIframe ? "Åpner dokument" : "Åpne dokument"}
                    onClick={openDocumentIframe}
                />
                <OpenDokumentIframe
                    id={id}
                    path={OpenDocumentUtils.getÅpneDokumentLenke(journalpostId, dokumentreferanse, false, true)}
                />
            </>
        );
    }
    return (
        <AapneDokumentKnapp
            journalpostId={journalpostId}
            dokumentreferanse={dokumentreferanse}
            status={DokumentStatusDto.FERDIGSTILT}
            variant="ikon"
            tittel="Åpne dokument"
        >
            <ExternalLinkIcon />
        </AapneDokumentKnapp>
    );

}


interface OpenDokumentIframeProps {
    id: string;
    path: string;
}
function OpenDokumentIframe({ path, id }: OpenDokumentIframeProps) {
    return (
        <>
            <iframe name="bidragui" style={{ display: "none" }}></iframe>
            <a id={id} style={{ display: "none" }} href={path} target="bidragui"></a>
        </>
    );
}
