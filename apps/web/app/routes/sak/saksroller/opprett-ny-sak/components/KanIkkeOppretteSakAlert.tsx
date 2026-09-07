import { Alert } from "@navikt/ds-react";

type Props = {
    visAlert: boolean;
};

export default function KanIkkeOppretteSakAlert({ visAlert }: Props) {
    if (visAlert) {
        <Alert variant="warning" size="small">
            Du har ikke tilgang til å opprette sak uten bidragsmottaker. Vennligst registrer bidragsmottaker eller
            kontakt support for å få tilgang.
        </Alert>;
    }

    return null;
}
