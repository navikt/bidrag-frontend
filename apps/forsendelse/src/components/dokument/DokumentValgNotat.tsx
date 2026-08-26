import { Loader } from "@navikt/ds-react";

import { useHentNotatMalDetaljer } from "../../hooks/useDokumentApi";
import { useOpprettForsendelse } from "../../pages/opprettforsendelse/OpprettForsendelseContext";
import DokumentValgMulti from "./DokumentValgMulti";

export default function DokumentValgNotat() {
    const options = useOpprettForsendelse();
    const { data: dokumentDetaljer, isFetching } = useHentNotatMalDetaljer(options);

    if (isFetching) {
        return <Loader size={"medium"} />;
    }

    return <DokumentValgMulti malDetaljer={dokumentDetaljer} />;
}
