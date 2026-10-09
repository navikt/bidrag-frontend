import { Tag } from "@navikt/ds-react";

/** Markerer personen modalen ble åpnet for. Personen kan ikke endres i skjemaet. */
export default function LåstPartTag() {
    return (
        <Tag size="xsmall" variant="neutral" title="Saken opprettes for denne personen. Personen kan ikke endres.">
            Låst
        </Tag>
    );
}
