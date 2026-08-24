import { useEffect, useRef } from "react";

import {
    Broadcast,
    BroadcastNames,
    type SamhandlerBroadcastMessage,
    SamhandlerBroadcastMessageSchema,
} from "../../types";

type SamhandlerSokPopupProps = {
    windowId: string;
    onResult: (data: SamhandlerBroadcastMessage | null) => void;
    onError?: (errorMessage: string) => void;
};

export default function SamhandlerSokPopup({ windowId, onResult, onError }: SamhandlerSokPopupProps) {
    const popupRef = useRef<Window | null>(null);
    const resultReceivedRef = useRef<boolean>(false);
    const checkIntervalRef = useRef<number | null>(null);
    const hasCalledOnResultRef = useRef<boolean>(false);

    useEffect(() => {
        resultReceivedRef.current = false;
        hasCalledOnResultRef.current = false;

        const width = Math.min(1500, screen.width);
        const height = Math.min(1200, screen.height);

        popupRef.current = window.open(
            `/samhandler/søk/?windowId=${windowId}`,
            "_blank",
            `location=yes,height=${height},width=${width},scrollbars=yes,status=yes`,
        );

        checkIntervalRef.current = window.setInterval(() => {
            if (popupRef.current?.closed && !resultReceivedRef.current && !hasCalledOnResultRef.current) {
                if (checkIntervalRef.current) {
                    clearInterval(checkIntervalRef.current);
                    checkIntervalRef.current = null;
                }

                hasCalledOnResultRef.current = true;
                resultReceivedRef.current = true;
                onResult(null);
            }
        }, 500);

        Broadcast.waitForBroadcast(
            BroadcastNames.SAMHANDLERSOK_RESULT_EVENT,
            SamhandlerBroadcastMessageSchema,
            windowId,
        )
            .then((res) => {
                if (checkIntervalRef.current) {
                    clearInterval(checkIntervalRef.current);
                    checkIntervalRef.current = null;
                }

                if (!hasCalledOnResultRef.current) {
                    hasCalledOnResultRef.current = true;
                    resultReceivedRef.current = true;
                    onResult(res.payload);
                }
            })
            .catch((error) => {
                if (checkIntervalRef.current) {
                    clearInterval(checkIntervalRef.current);
                    checkIntervalRef.current = null;
                }

                if (!hasCalledOnResultRef.current) {
                    hasCalledOnResultRef.current = true;
                    resultReceivedRef.current = true;
                    onError?.(error instanceof Error ? error.message : "Samhandlersøk feilet");
                    onResult(null);
                }
            })
            .finally(() => {
                window.focus();
                popupRef.current?.close();
            });

        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.close();
            }
        };
    }, []); // Tomt dependency array - kjør bare én gang

    return null;
}
