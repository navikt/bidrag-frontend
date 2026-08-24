import type { ButtonProps } from "@navikt/ds-react";
import type { ReactNode } from "react";

import type { PersonBroadcastMessage } from "../../types/broadcast";
import PopupSøkButton from "../PopupSøkButton";

const PERSONSOK_RESULT_EVENT = "personsok-result";

type PersonSøkProps = {
    onResult: (data: PersonBroadcastMessage | null) => void;
    onError?: (errorMessage: string) => void;
};

export default function PersonSøkButton({
    onResult,
    onError,
    ...buttonProps
}: PersonSøkProps & Omit<ButtonProps, "children" | "onError">): ReactNode {
    return (
        <PopupSøkButton<PersonBroadcastMessage>
            {...buttonProps}
            channelName={PERSONSOK_RESULT_EVENT}
            søkPath="/personsok"
            tekst="Personsøk"
            parseResultat={(data) => {
                const resultat = data as { id?: string; ok?: boolean; ident?: string };
                return resultat.ok && resultat.ident ? ({ ident: resultat.ident } as PersonBroadcastMessage) : null;
            }}
            onResult={onResult}
            onError={onError}
        />
    );
}
