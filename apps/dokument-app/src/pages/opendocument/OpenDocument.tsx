import { LoggerService, SecuritySessionUtils } from "@navikt/bidrag-ui-common";
import { Heading } from "@navikt/ds-react";
import React, { useEffect, useRef, useState } from "react";

import PageLoadingSpinner from "../../common/components/loadingspinner/PageLoadingSpinner";
import { OpenDocumentUtils } from "./OpenDocumentUtils";

interface OpenDocumentProps {
    journalpostId: string;
    dokumentreferanse?: string;
    dokumenter?: string[];
    hidden?: boolean;
    documentByte?: ArrayBuffer | string;
    closeTabAfterOpen?: boolean;
    openInNewTab?: boolean;
    openInBrowser?: boolean;
    resizeToA4?: boolean;
    optimizeForPrint?: boolean;
    open?: boolean;
}

export default function OpenDocument(props: OpenDocumentProps) {
    const [error, setError] = useState<string>();
    const isOpening = useRef(false);
    useEffect(() => {
        SecuritySessionUtils.isLoggedIn().then((result) => {
            if (result) {
                !isOpening.current &&
                    OpenDocumentUtils.openDocument(props).catch((e) => {
                        setError(`Kunne ikke åpne dokument`);
                        LoggerService.warn(`Kunne ikke åpne dokument ${JSON.stringify(props)}`, e);
                        window.alert(e.message);
                    });
                isOpening.current = true;
            } else {
                LoggerService.info(
                    "Bruker prøver å åpne dokument men er ikke logget inn. Sender bruker til innlogging",
                );
                OpenDocumentUtils.loginUserBeforeOpen();
            }
        });
    }, []);

    if (error) {
        return (
            <div style={{ margin: "0 auto", position: "absolute", top: "50%", left: "45%", textAlign: "center" }}>
                <Heading size="large" style={{ fontWeight: "normal" }}>
                    {error}
                </Heading>
            </div>
        );
    }
    return (
        <div style={{ display: props.hidden ? "none" : "initial" }}>
            <PageLoadingSpinner text={"Laster dokument..."} />
        </div>
    );
}
