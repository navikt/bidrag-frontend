import { BodyShort } from "@navikt/ds-react";
import { useState } from "react";

import { type Avvik, AvvikType } from "../../../../../types/AvvikTypes";
import type { IForsendelse } from "../../../../../types/Forsendelse";
import { useAvvikModalContext } from "../../AvvikshandteringButton";
import AvvikModalButtons from "../AvvikModalButtons";
import type { AvvikStepProps } from "../AvvikshandteringModal";
import Bekreftelse from "../Bekreftelse";

const fagomradeOptions = [
    {
        value: "BID",
        label: "Bidrag",
    },
    { value: "FAR", label: "Foreldreskap" },
];
function EndreFagomradeForsendelse(props: AvvikStepProps) {
    const { forsendelse } = useAvvikModalContext();
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
                forsendelse={forsendelse}
                kanEndreForsendelseEtterAvvik={props.kanEndreForsendelseEtterAvvik}
            />
            {props.activeStep === 2 && <EndreFagomradeBekreftelse fagomrade={fagomrade} forsendelse={forsendelse} />}
        </>
    );
}

interface EndreFagomradeFirstStepProps {
    isActive: boolean;
    forsendelse: IForsendelse;
    onSubmit: (values: EndreFagomradeFirstStepValues) => void;
    kanEndreForsendelseEtterAvvik?: (avvik: Avvik) => boolean;
}

interface EndreFagomradeFirstStepValues {
    fagomrade: string;
}

function EndreFagomradeFirstStep(props: EndreFagomradeFirstStepProps) {
    const erFagområdeBidrag = props.forsendelse?.tema === "BID";

    const nyFagområde = erFagområdeBidrag ? "FAR" : "BID";
    const fagomradeBeskrivelse = fagomradeOptions.find((option) => option.value === nyFagområde);
    if (!props.isActive) {
        return null;
    }

    const kanEndreEtterAvvik = props.kanEndreForsendelseEtterAvvik({
        type: AvvikType.ENDRE_FAGOMRADE,
        fagomrade: nyFagområde,
    });
    return (
        <div className={"endrefagomrade_forsendelse"}>
            <BodyShort spacing>
                Dette vil endre fagområde på journalposten til {nyFagområde} ({fagomradeBeskrivelse.label}). Fagområde
                kan bare endres mellom Foreldreskap og Bidrag. Hvis du endrer fagområde til Foreldreskap vil bare de som
                har Foreldreskap tilgang kunne se dokumentet i journalen.
            </BodyShort>
            <AvvikModalButtons
                submitButtonLabel={`Overfør til ${erFagområdeBidrag ? "Foreldreskap" : "Bidrag"} ${
                    !kanEndreEtterAvvik ? "og gå tilbake til sakshistorikk" : ""
                }`}
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
    forsendelse: IForsendelse;
}

function EndreFagomradeBekreftelse(props: EndreFagomradeBekreftelseProps) {
    const fagomradeOption = fagomradeOptions.find((option) => option.value === props.fagomrade);

    return (
        <Bekreftelse>
            <BodyShort>
                {" "}
                Fagområdet på journalposten er nå endret til {props.fagomrade} ({fagomradeOption.label}).
                <br />
                {props.fagomrade === "FAR"
                    ? "Bare de som har tilgang til Foreldreskap vil kunne se dokumentet i journalen."
                    : ""}
            </BodyShort>
        </Bekreftelse>
    );
}

export default EndreFagomradeForsendelse;
