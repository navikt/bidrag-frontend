import { Alert } from "@navikt/ds-react";

export default function BMUtenBarnAlert() {
    return (
        <Alert variant="warning" size="small">
            Du er i ferd med å opprette en sak uten barn. Barn kan legges til senere i sakvisningen.
        </Alert>
    );
}
