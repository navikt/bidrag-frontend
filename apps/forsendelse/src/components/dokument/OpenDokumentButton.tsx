import { OpenDocumentUtils } from "@bidrag/common";
import { ExternalLinkIcon as ExternalLink } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
    // if (status == "UNDER_REDIGERING") {
    //     return <MbdokUrl dokumentreferanse={dokumentreferanse} journalpostId={journalpostId} />;
    // }
    return (
        <>
            <Button
                as="span"
                size={"small"}
                variant={"tertiary"}
                icon={<ExternalLink />}
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

// function MbdokUrl({ dokumentreferanse, journalpostId }: IOpenDokumentButtonProps) {
//     const response = useHentDokumentUrl(journalpostId, dokumentreferanse);
//
//     return (
//         <a
//             className="hover:cursor-pointer m-auto hover:text-ax-accent-1000"
//             style={{ scale: 1.8 }}
//             href={response.data.dokumentUrl}
//         >
//             <ExternalLink />
//         </a>
//     );
// }

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
