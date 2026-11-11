import type { FieldErrors } from "react-hook-form";

import type { SakRedigeringData } from "../../felles/sakvisning-schema.ts";

export function finnFørsteValideringsfeil(feil: FieldErrors<SakRedigeringData>): string | undefined {
    const verdier: unknown[] = [feil];

    while (verdier.length > 0) {
        const verdi = verdier.shift();
        if (!verdi || typeof verdi !== "object") continue;
        if ("message" in verdi && typeof verdi.message === "string" && "type" in verdi && verdi.type === "custom") {
            return verdi.message;
        }
        verdier.push(...Object.values(verdi));
    }
}
