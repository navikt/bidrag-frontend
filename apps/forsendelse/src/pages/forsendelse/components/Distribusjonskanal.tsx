import { Loader } from "@navikt/ds-react";
import React from "react";

import { mapToDistribusjonKanalBeskrivelse } from "../../../helpers/forsendelseHelpers";
import { useDistribusjonKanal } from "../../../hooks/useDokumentApi";

export function Distribusjonskanal() {
    return (
        <React.Suspense fallback={<Loader size="xsmall" />}>
            <DistribusjonsKanalContent />
        </React.Suspense>
    );
}

function DistribusjonsKanalContent() {
    const distribusjonKanal = useDistribusjonKanal();
    return <div>{mapToDistribusjonKanalBeskrivelse(distribusjonKanal.distribusjonskanal)}</div>;
}
