import { BroadcastNames, type SamhandlerBroadcastMessage } from "@bidrag/common";
import { usePopupSøk } from "@bidrag/common/react_components/hooks/usePopupSøk";
import { useEffect } from "react";

type Props = {
    erÅpen: boolean;
    windowId: string;
    onResult: (data: SamhandlerBroadcastMessage | null) => void;
    onError?: (errorMessage: string) => void;
};

/**
 * Bruker samme `usePopupSøk`-hook som `SamhandlerSokButton` i @bidrag/common, men styrt eksternt
 * uten synlig knapp, siden søket her trigges fra en lenke inne i reell mottaker-valget.
 */
export default function SamhandlerPopup({ erÅpen, windowId, onResult, onError }: Props) {
    const { åpne, avbryt } = usePopupSøk<SamhandlerBroadcastMessage>({
        channelName: BroadcastNames.SAMHANDLERSOK_RESULT_EVENT,
        søkPath: "/samhandler/søk/",
        søkNavn: "samhandlersøk",
        parseResultat: (data) => {
            const resultat = data as { id?: string; payload?: SamhandlerBroadcastMessage | null };
            return resultat.payload === undefined ? null : resultat.payload;
        },
        onResult,
        onError,
    });

    useEffect(() => {
        if (erÅpen && windowId) {
            åpne();
        } else {
            avbryt();
        }
    }, [erÅpen, windowId]);

    return null;
}
