import { BodyShort } from "@navikt/ds-react";

import { AvvikType } from "../../../../../types/AvvikTypes";
import AvvikModalButtons from "../AvvikModalButtons";
import type { AvvikStepProps } from "../AvvikshandteringModal";
import Bekreftelse from "../Bekreftelse";

function SlettForsendelse(props: AvvikStepProps) {
    const handleSubmit = () => {
        props.sendAvvik({ type: AvvikType.SLETT_JOURNALPOST });
        props.setActiveStep(2);
    };

    return (
        <>
            {props.activeStep === 1 && (
                <>
                    <BodyShort>Slette feilbestilt forsendelse. Forsendelsen vil bli fjernet fra journalen</BodyShort>
                    <AvvikModalButtons
                        onSubmit={handleSubmit}
                        submitButtonLabel={"Slett og gå tilbake til sakshistorikk"}
                    />
                </>
            )}
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Forsendelse er slettet.</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

export default SlettForsendelse;
