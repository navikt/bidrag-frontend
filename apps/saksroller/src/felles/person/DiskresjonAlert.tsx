import { ExclamationmarkTriangleIcon } from "@navikt/aksel-icons";
import { BodyShort } from "@navikt/ds-react";

import type { Diskresjonskode } from "../sakvisning-schema.ts";

const diskresjonskodeForklaringer: Record<Diskresjonskode, string> = {
    SPSF: "Strengt fortrolig (kode 6)",
    SPFO: "Fortrolig (kode 7)",
    URIK: "Utenriksadresse",
    MILI: "Militær",
    PEND: "Pendler",
    SVAL: "Svalbard",
    P19: "Paragraf 19 (adressesperre)",
};

/** Returnerer lesbar forklaring for en diskresjonskode. */
export function hentDiskresjonskodeForklaring(kode: Diskresjonskode): string {
    return diskresjonskodeForklaringer[kode];
}

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
