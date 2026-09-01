import { BodyLong, BodyShort } from "@navikt/ds-react";

import { useHentJournalpost } from "../../../../../hooks/useDokumentApi";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

type FarskapUtelukketProps = AvvikTypeCommonProps;

function FarskapUtelukket(props: FarskapUtelukketProps) {
    const handleSubmit = () => {
        props.sendAvvik({
            type: AvvikType.FARSKAP_UTELUKKET,
        });
        props.setActiveStep(2);
    };

    return (
        <>
            <FarskapUtelukketFirstStep isActive={props.activeStep === 1} onSubmit={handleSubmit} />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Dokumentet er merket som farskap utelukket</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface BestillOriginalFirstStepProps {
    isActive: boolean;
    onSubmit: () => void;
}

function FarskapUtelukketFirstStep(props: BestillOriginalFirstStepProps) {
    const journalpost = useHentJournalpost();
    if (!props.isActive) {
        return null;
    }

    return (
        <div>
            <BodyLong>
                Hvis dokumentet gjelder en potensiell far, men hvor farskapet er utelukket, kan du merke dokumentet som
                "Farskap utelukket". <br />
                <br />
                Dette vil legge til merkingen "FARSKAP UTELUKKET" på tittel til dokumentet som indikerer at personen
                ikke er far til barnet. Dokumenter med slik merking vil filtreres ut fra journalen. Det vil fortsatt
                være mulig å aktivt velge å vise dokumenter med denne merkingen i journalen hvis det er nødvendig.
                <br />
                <br />
                {journalpost.isBidragJournalpost && (
                    <>
                        I tillegg vil fagområdet på journalposten bli endret til "FAR". Da vil bare saksbehandlere med
                        farskap tilgang kunne se dokumentet.
                    </>
                )}
            </BodyLong>
            <AvvikModalButtons onSubmit={props.onSubmit} submitButtonLabel={"Utfør"} />
        </div>
    );
}

export default FarskapUtelukket;
