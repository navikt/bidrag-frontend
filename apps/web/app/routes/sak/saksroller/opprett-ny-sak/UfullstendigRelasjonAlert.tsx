import { Alert } from "@navikt/ds-react";

export default function UfullstendigRelasjonAlert() {
    return (
        <Alert variant="warning" size="small">
            OBS: Valgte barn har manglende eller ufullstendig relasjon til partene. Vennligst dobbeltsjekk relasjoner
            før du fortsetter
        </Alert>
    );
}
