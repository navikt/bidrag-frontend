import { BodyShort } from "@navikt/ds-react";
import React from "react";

import { AvvikType } from "../../../../../types/api/AvvikTypes";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { AvvikTypeCommonProps } from "./AvvikTypes";

function InngaendeTilUtgaendeDokument(props: AvvikTypeCommonProps) {
    const handleSubmit = () => {
        props.sendAvvik({ type: AvvikType.INNG_TIL_UTG_DOKUMENT });
        props.setActiveStep(2);
    };

    return (
        <>
            {props.activeStep === 1 && (
                <>
                    <BodyShort>
                        Endrer statusen på journalposten fra inngående til utgående. Vær oppmerksom på at du ikke kan
                        endre statusen tilbake igjen.
                    </BodyShort>
                    <AvvikModalButtons onSubmit={handleSubmit} submitButtonLabel={"Lagre"} />
                </>
            )}
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Lagring fullført.</BodyShort>
                    <BodyShort>Statusen er endret til utgående.</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

export default InngaendeTilUtgaendeDokument;
