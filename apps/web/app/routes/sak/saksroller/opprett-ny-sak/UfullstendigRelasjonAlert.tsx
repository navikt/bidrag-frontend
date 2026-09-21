import { Alert } from "@navikt/ds-react";

type Props = {
    visAlert: boolean;
};

export default function UfullstendigRelasjonAlert({ visAlert }: Props) {
    if (!visAlert) {
        return null;
    }

    return (
        <Alert variant="warning" size="small">
            OBS: Valgte barn har manglende eller ufullstendig relasjon til partene. Vennligst dobbeltsjekk relasjoner
            før du fortsetter
        </Alert>
    );
}
