import { BodyShort } from "@navikt/ds-react";
import React, { useState } from "react";

import { AvvikType } from "../../../../../types/api/AvvikTypes";
import { Journalpost } from "../../../../../types/journalpost";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { AvvikTypeCommonProps } from "./AvvikTypes";
import { fagomradeOptions } from "./AvvikTypes";

interface EndreFagomradeProps extends AvvikTypeCommonProps {
    journalpost: Journalpost;
}

function EndreFagomradeForsendelse(props: EndreFagomradeProps) {
    const [fagomrade, setFagomrade] = useState("");

    const handleSubmitFirstStep = (values: EndreFagomradeFirstStepValues) => {
        setFagomrade(values.fagomrade);
        props.sendAvvik({
            type: AvvikType.ENDRE_FAGOMRADE,
            fagomrade: values.fagomrade,
        });
        props.setActiveStep(2);
    };

    return (
        <>
            <EndreFagomradeFirstStep
                isActive={props.activeStep === 1}
                onSubmit={handleSubmitFirstStep}
                journalpost={props.journalpost}
            />
            {props.activeStep === 2 && (
                <EndreFagomradeBekreftelse fagomrade={fagomrade} journalpost={props.journalpost} />
            )}
        </>
    );
}

interface EndreFagomradeFirstStepProps {
    isActive: boolean;
    journalpost: Journalpost;
    onSubmit: (values: EndreFagomradeFirstStepValues) => void;
}

interface EndreFagomradeFirstStepValues {
    fagomrade: string;
}

function EndreFagomradeFirstStep(props: EndreFagomradeFirstStepProps) {
    const erFagområdeBidrag = props.journalpost?.fagomrade == "BID";

    const nyFagområde = erFagområdeBidrag ? "FAR" : "BID";
    const fagomradeBeskrivelse = fagomradeOptions.find((option) => option.value == nyFagområde);
    if (!props.isActive) {
        return null;
    }

    return (
        <div className={"endrefagomrade_forsendelse"}>
            <BodyShort spacing>
                Dette vil endre fagområde på journalposten til {nyFagområde} ({fagomradeBeskrivelse.label}). Fagområde
                kan bare endres mellom Farskap og Bidrag. Hvis du endrer fagområde til Farskap vil bare de som har
                Farskap tilgang kunne se dokumentet i journalen.
            </BodyShort>
            <AvvikModalButtons
                submitButtonLabel={`Overfør til ${erFagområdeBidrag ? "Farskap" : "Bidrag"}`}
                onSubmit={() =>
                    props.onSubmit({
                        fagomrade: nyFagområde,
                    })
                }
            />
        </div>
    );
}

interface EndreFagomradeBekreftelseProps {
    fagomrade: string;
    journalpost: Journalpost;
}

function EndreFagomradeBekreftelse(props: EndreFagomradeBekreftelseProps) {
    const fagomradeOption = fagomradeOptions.find((option) => option.value == props.fagomrade);

    return (
        <Bekreftelse>
            <BodyShort>
                {" "}
                Fagområdet på journalposten er nå endret til {props.fagomrade} ({fagomradeOption.label}).
                <br />
                {props.fagomrade == "FAR"
                    ? "Bare de som har tilgang til Farskap vil kunne se dokumentet i journalen."
                    : ""}
            </BodyShort>
        </Bekreftelse>
    );
}

export default EndreFagomradeForsendelse;
