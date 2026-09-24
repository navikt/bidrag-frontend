import type { FieldErrors } from "react-hook-form";
import type { SakRedigeringData } from "./sakvisning-schema.ts";

export type SakstypeVisning = "Barnebidrag" | "Ektefellebidrag" | "Oppfostringsbidrag" | "Farskap";

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

export function utledSakstype(roller: SakRedigeringData["roller"]): SakstypeVisning {
    const harBarn = roller.some((r) => r.type === "BA");
    const harBP = roller.some((r) => r.type === "BP");
    const harBM = roller.some((r) => r.type === "BM");

    if (!harBarn && harBP && harBM) return "Ektefellebidrag";
    if (harBarn && harBP && !harBM) return "Oppfostringsbidrag";
    if (harBarn && !harBP && harBM) return "Farskap";
    return "Barnebidrag";
}
