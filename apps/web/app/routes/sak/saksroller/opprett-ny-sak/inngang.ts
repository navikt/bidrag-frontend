import { MAKS_ALDER_BARN, MYNDYG_BARN_ALDER, type PartRolle } from "./opprett-sak-schema";

export type InngangRolle = "BP" | "BM" | "BA";

/**
 * Forhåndsutfylling når flyten åpnes som modal fra et annet skjermbilde.
 * `initialForelder` foreslås først i partskortet og låses ikke. `eierfogd` er enheten
 * skjermbildet ville brukt, og vises som avvik hvis arbeidsfordelingen gir en annen enhet.
 */
export type OpprettSakInngang = {
    ident: string;
    rolle?: InngangRolle;
    initialForelder?: { ident: string; rolle: "BP" | "BM" };
    eierfogd?: string;
};

/** Barn over 18 år regnes som part. Uten kjent alder velger saksbehandler selv. */
export function tilPartRolle(rolle: InngangRolle | undefined, alder: number | null): PartRolle | null {
    if (rolle === "BP") return "bidragspliktig";
    if (rolle === "BM") return "bidragsmottaker";
    if (rolle === "BA") {
        if (alder === null || alder > MAKS_ALDER_BARN) return null;
        return alder >= MYNDYG_BARN_ALDER ? "barn_over_18" : "barn_under_18";
    }
    return null;
}
