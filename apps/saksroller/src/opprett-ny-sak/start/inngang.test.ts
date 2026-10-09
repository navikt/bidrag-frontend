import { describe, expect, test } from "vitest";
import { tilPartRolle } from "./inngang";

describe("tilPartRolle", () => {
    test.each([
        { rolle: "BP", alder: 40, forventet: "bidragspliktig" },
        { rolle: "BM", alder: null, forventet: "bidragsmottaker" },
        { rolle: "BA", alder: 10, forventet: "barn_under_18" },
        { rolle: "BA", alder: 19, forventet: "barn_over_18" },
        { rolle: "BA", alder: null, forventet: null },
        { rolle: "BA", alder: 40, forventet: null },
        { rolle: undefined, alder: 10, forventet: null },
    ] as const)("$rolle med alder $alder gir $forventet", ({ rolle, alder, forventet }) => {
        expect(tilPartRolle(rolle, alder)).toBe(forventet);
    });
});
