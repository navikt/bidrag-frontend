import { Alert } from "@navikt/ds-react";

export default function KanIkkeOppretteSakAlert() {
    return (
        <Alert variant="warning" size="small">
            Du har ikke tilgang til å opprette sak uten bidragsmottaker. Vennligst registrer bidragsmottaker eller
            kontakt support for å få tilgang.
        </Alert>
    );
}
