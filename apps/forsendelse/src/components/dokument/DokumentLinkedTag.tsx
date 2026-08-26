import { LinkIcon } from "@navikt/aksel-icons";
import { Tag } from "@navikt/ds-react";

export default function DokumentLinkedTag() {
    return (
        <Tag variant="info" size="small" className=" rounded-md">
            <LinkIcon />
        </Tag>
    );
}
