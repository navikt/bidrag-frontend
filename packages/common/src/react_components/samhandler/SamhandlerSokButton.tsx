import type { ButtonProps } from "@navikt/ds-react";
import type { ReactNode } from "react";

import { BroadcastNames, type SamhandlerBroadcastMessage } from "../../types";
import PopupSøkButton from "../PopupSøkButton";

type SamhandlerSokProps = {
    onResult: (data: SamhandlerBroadcastMessage | null) => void;
    onError?: (errorMessage: string) => void;
};

export default function SamhandlerSokButton({
    onResult,
    onError,
    ...buttonProps
}: SamhandlerSokProps & Omit<ButtonProps, "children" | "onError">): ReactNode {
    return (
        <PopupSøkButton<SamhandlerBroadcastMessage>
            {...buttonProps}
            channelName={BroadcastNames.SAMHANDLERSOK_RESULT_EVENT}
            søkPath="/samhandler/søk/"
            tekst="Samhandlersøk"
            parseResultat={(data) => {
                const resultat = data as { id?: string; payload?: SamhandlerBroadcastMessage | null };
                if (resultat.payload === undefined) {
                    return null;
                }

                return resultat.payload;
            }}
            onResult={onResult}
            onError={onError}
        />
    );
}
