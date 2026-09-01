import { BodyShort } from "@navikt/ds-react";
import { useState } from "react";

import { useAppContext } from "../../../../../store/AppContext";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

function FeilforeSak(props: AvvikTypeCommonProps) {
    const { saksnummer } = useAppContext().appState;
    const [feilfortSaksnummer, setFeilfortSaksnummer] = useState<string>();

    const handleSubmit = () => {
        props.sendAvvik({ type: AvvikType.FEILFORE_SAK, saksnummer: saksnummer });
        props.setActiveStep(2);
        setFeilfortSaksnummer(saksnummer);
    };

    return (
        <>
            <FeilforeSakFirstStep saksnummer={saksnummer} isActive={props.activeStep === 1} onSubmit={handleSubmit} />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Sak {feilfortSaksnummer} er feilført.</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface FeilforeSakFirstStepProps {
    saksnummer: string;
    isActive: boolean;
    onSubmit: () => void;
}

function FeilforeSakFirstStep(props: FeilforeSakFirstStepProps) {
    if (!props.isActive) {
        return null;
    }

    return (
        <>
            <BodyShort>
                Det er mulighet for å feilføre journalposten for sak <strong>{props.saksnummer}</strong>.
            </BodyShort>
            <BodyShort>
                Journalposten vil fortsatt være knyttet til personen og saken, og dukke opp når man velger å vise
                feilførte i journalen.
            </BodyShort>
            <BodyShort>Dette vil ikke påvirke journalpostens tilknytning til andre saker.</BodyShort>
            <AvvikModalButtons onSubmit={() => props.onSubmit()} submitButtonLabel={"Feilføre"} />
        </>
    );
}

export default FeilforeSak;
