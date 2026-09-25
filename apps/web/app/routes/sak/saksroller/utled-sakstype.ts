import type { SakRedigeringData } from "./sakvisning-schema.ts";

export type SakstypeVisning = "Barnebidrag" | "Ektefellebidrag" | "Oppfostringsbidrag" | "Farskap";

export function utledSakstype(roller: SakRedigeringData["roller"]): SakstypeVisning {
    const harBarn = roller.some((r) => r.type === "BA");
    const harBP = roller.some((r) => r.type === "BP");
    const harBM = roller.some((r) => r.type === "BM");

    if (!harBarn && harBP && harBM) return "Ektefellebidrag";
    if (harBarn && harBP && !harBM) return "Oppfostringsbidrag";
    if (harBarn && !harBP && harBM) return "Farskap";
    return "Barnebidrag";
}
