import { Loader, Tag } from "@navikt/ds-react";
import { DokumentStatus, DokumentStatusDisplayName, DokumentStatusTags } from "../../constants/DokumentStatus";

interface DokumentStatusTagProps {
    status: DokumentStatus;
}
export default function DokumentStatusTag({ status }: DokumentStatusTagProps) {
    const erUnderProduksjon = [
        DokumentStatus.UNDER_PRODUKSJON,
        DokumentStatus.BESTILLING_FEILET,
        DokumentStatus.IKKE_BESTILT,
    ].includes(status);
    return (
        <span className="flex flex-row gap-[5px] align-center">
            <Tag variant={DokumentStatusTags[status]} size="xsmall" className="w-max p-[0.3rem] rounded-md">
                {DokumentStatusDisplayName[status] ?? "Ukjent"}
            </Tag>
            {erUnderProduksjon && <Loader size="xsmall" />}
        </span>
    );
}
