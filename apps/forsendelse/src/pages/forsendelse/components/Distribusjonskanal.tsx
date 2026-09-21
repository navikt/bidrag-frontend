import { Loader } from "@navikt/ds-react";
import { Suspense } from "react";
import { mapToDistribusjonKanalBeskrivelse } from "../../../helpers/forsendelseHelpers";
import { useDistribusjonKanal } from "../../../hooks/useDokumentApi";

export function Distribusjonskanal() {
    return (
        <Suspense fallback={<Loader size="xsmall" />}>
            <DistribusjonsKanalContent />
        </Suspense>
    );
}

function DistribusjonsKanalContent() {
    const distribusjonKanal = useDistribusjonKanal();
    return <div>{mapToDistribusjonKanalBeskrivelse(distribusjonKanal.distribusjonskanal)}</div>;
}
