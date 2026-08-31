import { Loader } from "@navikt/ds-react";

import DokumentValg from "../../components/dokument/DokumentValg";
import DokumentValgMulti from "../../components/dokument/DokumentValgMulti";
import { useDokumentMalDetaljer2 } from "../../hooks/useDokumentApi";
import { useOpprettForsendelse } from "./OpprettForsendelseContext";

export default function DokumentValgFromQuery() {
    const options = useOpprettForsendelse();
    const { data: dokumentDetaljerV2, isFetching } = useDokumentMalDetaljer2({
        ...options,
    });

    if (isFetching) {
        return <Loader size={"medium"} />;
    }
    if (dokumentDetaljerV2.automatiskOpprettDokumenter.length > 0) {
        return (
            <DokumentValgMulti
                malDetaljer={dokumentDetaljerV2.dokumentMalDetaljer}
                automatiskOpprettDokumenter={dokumentDetaljerV2.automatiskOpprettDokumenter}
            />
        );
    }
    return <DokumentValg malDetaljer={dokumentDetaljerV2.dokumentMalDetaljer} />;
}
