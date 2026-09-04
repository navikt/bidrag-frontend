import { Alert } from "@navikt/ds-react";

import { useSakContext } from "../OpprettSakContext.tsx";

// Migrert fra bidrag-ui (apps/sak-ui/src/pages/opprett-sak/container/sakErrorMessage/SakErrorMessage.tsx).
export default function SakErrorMessage() {
    const { errorMessage } = useSakContext();

    if (!errorMessage) {
        return null;
    }

    return (
        <Alert variant="error" data-testid="test-opprettsak-sakerrormessage">
            {errorMessage}
        </Alert>
    );
}
