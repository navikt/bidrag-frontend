import { MAKS_ALDER_BARN, MYNDYG_BARN_ALDER, type PartRolle } from "./opprett-sak-schema";

export type SaksrolleAlternativ = {
    label: string;
    value: PartRolle;
};

export function filtrerSaksroller(
    sakstype: string | null,
    partISakenAlder: number | null,
    roller: SaksrolleAlternativ[],
): SaksrolleAlternativ[] {
    if (sakstype === "EKTEFELLEBIDRAG") {
        return roller.filter((valg) => !["barn_over_18", "barn_under_18"].includes(valg.value));
    }

    if (partISakenAlder === null) {
        return roller;
    }

    if (partISakenAlder >= MYNDYG_BARN_ALDER && partISakenAlder <= MAKS_ALDER_BARN) {
        return roller.filter((valg) => valg.value !== "barn_under_18");
    }

    if (partISakenAlder < MYNDYG_BARN_ALDER) {
        return roller.filter((valg) => valg.value !== "barn_over_18");
    }

    return roller.filter((valg) => !["barn_over_18", "barn_under_18"].includes(valg.value));
}
