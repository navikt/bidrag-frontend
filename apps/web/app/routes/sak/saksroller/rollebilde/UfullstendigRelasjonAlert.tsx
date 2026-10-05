import { BodyLong, LocalAlert } from "@navikt/ds-react";

import type { SakRedigeringData } from "../felles/sakvisning-schema.ts";

type Props = {
    barnIdenter: string[];
    roller: SakRedigeringData["roller"];
};

export default function UfullstendigRelasjonAlert({ barnIdenter, roller }: Props) {
    if (barnIdenter.length === 0) {
        return null;
    }

    const navn = barnIdenter.map((ident) => roller.find((r) => r.fodselsnummer === ident)?.navn ?? ident);

    return (
        <LocalAlert status="warning" size="small" as="div">
            <LocalAlert.Header>
                <LocalAlert.Title>Ufullstendig relasjon</LocalAlert.Title>
            </LocalAlert.Header>
            <LocalAlert.Content>
                <BodyLong size="small">
                    {navn.join(", ")} har manglende eller ufullstendig relasjon til partene. Kontroller relasjonene før
                    du lagrer.
                </BodyLong>
            </LocalAlert.Content>
        </LocalAlert>
    );
}
