import { Button, type ButtonProps, HStack, Loader } from "@navikt/ds-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { BroadcastNames, type SamhandlerBroadcastMessage } from "../../types";

type SamhandlerSokProps = {
    onResult: (data: SamhandlerBroadcastMessage | null) => void;
    onError?: (errorMessage: string) => void;
};

export default function SamhandlerSokButton({
    onResult,
    onError,
    ...buttonProps
}: SamhandlerSokProps & Omit<ButtonProps, "children" | "onError">): ReactNode {
    const [venter, setVenter] = useState(false);
    const popup = useRef<Window | null>(null);
    const kanal = useRef<BroadcastChannel | null>(null);
    const lukkPopup = () => {
        if (popup.current && !popup.current.closed) {
            popup.current.close();
        }
        popup.current = null;
        window.focus();
    };

    useEffect(() => {
        return () => {
            kanal.current?.close();
            lukkPopup();
        };
    }, []);

    const avbryt = () => {
        kanal.current?.close();
        kanal.current = null;
        lukkPopup();
        setVenter(false);
    };

    function openSamhandlerSearch() {
        avbryt();
        const windowId = crypto.randomUUID();
        const width = Math.min(1500, screen.width);
        const height = Math.min(1200, screen.height);

        const openedWindow = window.open(
            `/samhandler/søk/?windowId=${windowId}`,
            "_blank",
            `location=yes,height=${height},width=${width},scrollbars=yes,status=yes`,
        );

        if (!openedWindow) {
            onError?.("Kunne ikke åpne samhandlersøk. Tillat popup-vinduer for denne siden.");
            return;
        }

        popup.current = openedWindow;
        setVenter(true);

        const resultChannel = new BroadcastChannel(BroadcastNames.SAMHANDLERSOK_RESULT_EVENT);
        kanal.current = resultChannel;
        resultChannel.onmessage = (event: MessageEvent<string>) => {
            let data: { id?: string; payload: SamhandlerBroadcastMessage | null };
            try {
                data = JSON.parse(event.data) as { id?: string; payload: SamhandlerBroadcastMessage | null };
            } catch {
                onError?.("Kunne ikke lese resultatet fra samhandlersøk");
                return;
            }

            if (data.id !== windowId) {
                return;
            }

            resultChannel.close();
            kanal.current = null;
            setVenter(false);
            onResult(data.payload);
            lukkPopup();
        };
        resultChannel.onmessageerror = () => {
            avbryt();
            onError?.("Kunne ikke lese resultatet fra samhandlersøk");
        };
    }

    return (
        <div className={"pdlSearchButton whitespace-nowrap self-center h-full"}>
            <Button
                {...buttonProps}
                variant={buttonProps.variant ?? "secondary"}
                size={buttonProps.size ?? "small"}
                type={"button"}
                title={venter ? "Venter på resultat fra samhandlersøk" : "Åpne samhandlersøk"}
                onClick={venter ? avbryt : openSamhandlerSearch}
            >
                {venter ? (
                    <HStack gap="space-4" align="center" wrap={false}>
                        <span>Avbryt</span>
                        <Loader size="xsmall" title="Venter på resultat fra samhandlersøk" />
                    </HStack>
                ) : (
                    "Samhandlersøk"
                )}
            </Button>
        </div>
    );
}
