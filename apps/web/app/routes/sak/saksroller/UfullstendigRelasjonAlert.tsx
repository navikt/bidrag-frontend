import { Alert, BodyLong } from "@navikt/ds-react";

import type { SakRedigeringData } from "./sakvisning-schema.ts";

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
        <Alert variant="warning" size="small">
            <BodyLong size="small">
                OBS: {navn.join(", ")} har manglende eller ufullstendig relasjon til partene. Dobbeltsjekk relasjoner
                før du lagrer.
            </BodyLong>
        </Alert>
    );
}
