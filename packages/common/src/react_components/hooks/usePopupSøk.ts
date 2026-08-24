import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const resultatEnvelopeSchema = z.object({ id: z.string().optional() }).passthrough();

export type UsePopupSøkProps<T> = {
    channelName: string;
    søkPath: string;
    søkNavn: string;
    parseResultat: (data: unknown) => T | null;
    onResult: (result: T | null) => void;
    onError?: (errorMessage: string) => void;
};

export function usePopupSøk<T>({
    channelName,
    søkPath,
    søkNavn,
    parseResultat,
    onResult,
    onError,
}: UsePopupSøkProps<T>) {
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

    const ryddOpp = () => {
        kanal.current?.close();
        kanal.current = null;
        lukkPopup();
    };

    const avbryt = () => {
        ryddOpp();
        setVenter(false);
    };

    useEffect(() => ryddOpp, []);

    const åpne = () => {
        avbryt();

        const windowId = crypto.randomUUID();
        const width = Math.min(1500, window.screen.width);
        const height = Math.min(1200, window.screen.height);
        const openedWindow = window.open(
            `${søkPath}${søkPath.includes("?") ? "&" : "?"}windowId=${encodeURIComponent(windowId)}`,
            "_blank",
            `location=yes,height=${height},width=${width},scrollbars=yes,status=yes`,
        );

        if (!openedWindow) {
            onError?.(`Kunne ikke åpne ${søkNavn}. Tillat popup-vinduer for denne siden.`);
            return;
        }

        popup.current = openedWindow;
        setVenter(true);

        const resultChannel = new BroadcastChannel(channelName);
        kanal.current = resultChannel;
        resultChannel.onmessage = (event: MessageEvent<string>) => {
            try {
                const resultatEnvelope = resultatEnvelopeSchema.safeParse(JSON.parse(event.data));
                if (!resultatEnvelope.success) {
                    onError?.(`Kunne ikke lese resultatet fra ${søkNavn}.`);
                    return;
                }

                if (resultatEnvelope.data.id !== windowId) {
                    return;
                }

                const resultat = parseResultat(resultatEnvelope.data);
                resultChannel.close();
                kanal.current = null;
                setVenter(false);
                onResult(resultat);
                lukkPopup();
            } catch {
                onError?.(`Kunne ikke lese resultatet fra ${søkNavn}.`);
            }
        };
        resultChannel.onmessageerror = () => {
            avbryt();
            onError?.(`Kunne ikke lese resultatet fra ${søkNavn}.`);
        };
    };

    return { avbryt, åpne, venter };
}
