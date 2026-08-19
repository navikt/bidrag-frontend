import { Alert, Button } from "@navikt/ds-react";
import _ from "lodash";
import React, { type ReactElement } from "react";

import { useAppContext } from "../../../store/AppContext";

export default function Feilmeldinger(): ReactElement | null {
    const { errorMessages, setErrorMessages } = useAppContext();
    function onUpdateFeilmelding(feilToRemoveArray: string[]) {
        setErrorMessages(feilToRemoveArray);
    }

    function getWhatToNotRemoveFromArray(feilmeldingToRemove: string) {
        return errorMessages.filter((feilmelding) => feilmelding !== feilmeldingToRemove);
    }

    function removeALertStripeFromArrayOfFeil(feilmelding: string) {
        onUpdateFeilmelding(getWhatToNotRemoveFromArray(feilmelding));
    }

    if (!errorMessages || !_.isArray(errorMessages)) return null;

    return (
        <>
            {errorMessages.map((enkelFeil, index) => (
                <Alert
                    className={"alert-feilmelding"}
                    onClick={() => removeALertStripeFromArrayOfFeil(enkelFeil)}
                    key={index}
                    variant="warning"
                >
                    <div style={{ display: "flex", width: "95vw", justifyContent: "space-between" }}>
                        {enkelFeil} <Button size="small" variant="tertiary-neutral" />
                    </div>
                </Alert>
            ))}
        </>
    );
}
