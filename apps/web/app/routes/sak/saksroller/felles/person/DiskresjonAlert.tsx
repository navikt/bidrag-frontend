import { ExclamationmarkTriangleIcon } from "@navikt/aksel-icons";
import { BodyShort } from "@navikt/ds-react";

import type { Diskresjonskode } from "../sakvisning-schema.ts";
import { hentDiskresjonskodeForklaring } from "../utils.ts";

type Props = {
    diskresjonskode: Diskresjonskode;
};

export default function DiskresjonAlert({ diskresjonskode }: Props) {
    return (
        <BodyShort className="mt-1 font-semibold text-ax-warning-900 flex gap-1" size="small">
            <ExclamationmarkTriangleIcon aria-hidden fontSize="1.2rem" />
            {hentDiskresjonskodeForklaring(diskresjonskode)}
        </BodyShort>
    );
}
