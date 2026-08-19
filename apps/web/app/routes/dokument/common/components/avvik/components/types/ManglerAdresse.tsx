import { BodyShort } from "@navikt/ds-react";
import { Panel } from "@navikt/ds-react";
import React from "react";

import { AvvikType } from "../../../../../types/api/AvvikTypes";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { AvvikTypeCommonProps } from "./AvvikTypes";

type ManglerAdresseProps = AvvikTypeCommonProps;

function ManglerAdresse(props: ManglerAdresseProps) {
    const handleSubmit = () => {
        props.sendAvvik({
            type: AvvikType.MANGLER_ADRESSE,
        });
        props.setActiveStep(2);
    };

    return (
        <>
            <ManglerAdresseFirstStep isActive={props.activeStep === 1} onSubmit={handleSubmit} />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Distribusjon er nå avbrutt.</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface ManglerAdresseFirstStepProps {
    isActive: boolean;
    onSubmit: () => void;
}

function ManglerAdresseFirstStep(props: ManglerAdresseFirstStepProps) {
    if (!props.isActive) {
        return null;
    }

    return (
        <div>
            <Panel>
                <BodyShort spacing>
                    Hvis mottaker mangler adresse kan du avbryte distribusjon. Denne operasjonen vil sette status på
                    journalposten til <i>Ingen distribusjon</i>.
                </BodyShort>
                <BodyShort spacing>Husk at du kan manuelt endre på adresse før bestilling av distribusjon.</BodyShort>
            </Panel>
            <AvvikModalButtons onSubmit={() => props.onSubmit()} submitButtonLabel={"Avbryt distribusjon"} />
        </div>
    );
}

export default ManglerAdresse;
