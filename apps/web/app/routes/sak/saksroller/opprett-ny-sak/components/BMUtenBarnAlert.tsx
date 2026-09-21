import { Alert } from "@navikt/ds-react";

type Props = {
    visAlert: boolean;
};

export default function BMUtenBarnAlert({ visAlert }: Props) {
    if (visAlert) {
        return (
            <Alert variant="warning" size="small">
                Du er i ferd med å opprette en sak uten barn. Barn kan legges til senere i sakvisningen.
            </Alert>
        );
    }

    return null;
}
