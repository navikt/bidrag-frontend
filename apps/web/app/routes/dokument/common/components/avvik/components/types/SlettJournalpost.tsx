import { BodyShort } from "@navikt/ds-react";
import React from "react";

import { AvvikType } from "../../../../../types/api/AvvikTypes";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { AvvikTypeCommonProps } from "./AvvikTypes";

function SlettJournalpost(props: AvvikTypeCommonProps) {
    const handleSubmit = () => {
        props.sendAvvik({ type: AvvikType.SLETT_JOURNALPOST });
        props.setActiveStep(2);
    };

    return (
        <>
            {props.activeStep === 1 && (
                <>
                    <BodyShort>Slette feilbestilt brev eller notat.</BodyShort>
                    <AvvikModalButtons onSubmit={handleSubmit} submitButtonLabel={"Slett"} />
                </>
            )}
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Dokumentet er slettet.</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

export default SlettJournalpost;
