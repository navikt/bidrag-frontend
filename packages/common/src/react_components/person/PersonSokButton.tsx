import { Button, type ButtonProps, HStack, Loader } from "@navikt/ds-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { PersonBroadcastMessage } from "../../types/broadcast";

const PERSONSOK_RESULT_EVENT = "personsok-result";

type PersonSokProps = {
    onResult: (data: PersonBroadcastMessage | null) => void;
    onError?: (errorMessage: string) => void;
};
export default function PersonSokButton({
    onResult,
    onError,
    ...buttonProps
}: PersonSokProps & Omit<ButtonProps, "children" | "onError">): ReactNode {
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

    function openPersonSearch() {
        avbryt();

        const width = Math.min(1500, window.screen.width);
        const height = Math.min(1200, window.screen.height);
        const id = crypto.randomUUID();
        const openedWindow = window.open(
            `/personsok?windowId=${encodeURIComponent(id)}`,
            "_blank",
            `location=yes,height=${height},width=${width},scrollbars=yes,status=yes`,
        );

        if (!openedWindow) {
            onError?.("Kunne ikke åpne personsøk. Tillat popup-vinduer for denne siden.");
            return;
        }

        popup.current = openedWindow;
        setVenter(true);

        const resultChannel = new BroadcastChannel(PERSONSOK_RESULT_EVENT);
        kanal.current = resultChannel;
        resultChannel.onmessage = (event: MessageEvent<string>) => {
            let data: { id?: string; ok?: boolean; ident?: string };
            try {
                data = JSON.parse(event.data) as { id?: string; ok?: boolean; ident?: string };
            } catch {
                return;
            }

            if (data.id !== id) {
                return;
            }

            resultChannel.close();
            kanal.current = null;
            setVenter(false);
            onResult(data.ok && data.ident ? ({ ident: data.ident } as PersonBroadcastMessage) : null);
            lukkPopup();
        };
        resultChannel.onmessageerror = () => {
            avbryt();
            onError?.("Kunne ikke lese resultatet fra personsøk");
        };
    }

    return (
        <div className={"pdlSearchButton whitespace-nowrap self-center h-full"}>
            <Button
                {...buttonProps}
                variant={buttonProps.variant ?? "secondary"}
                size={buttonProps.size ?? "small"}
                type={"button"}
                title={venter ? "Venter på resultat fra personsøk" : "Åpne personsøk"}
                onClick={venter ? avbryt : openPersonSearch}
            >
                {venter ? (
                    <HStack gap="space-4" align="center" wrap={false}>
                        <span>Avbryt</span>
                        <Loader size="xsmall" title="Venter på resultat fra personsøk" />
                    </HStack>
                ) : (
                    "Personsøk"
                )}
            </Button>
        </div>
    );
}
