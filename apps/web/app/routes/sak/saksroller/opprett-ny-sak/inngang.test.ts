import { describe, expect, test } from "vitest";
import { tilPartRolle } from "./inngang";

describe("tilPartRolle", () => {
    test("BP og BM oversettes direkte", () => {
        expect(tilPartRolle("BP", 40)).toBe("bidragspliktig");
        expect(tilPartRolle("BM", null)).toBe("bidragsmottaker");
    });

    test("BA oversettes etter alder", () => {
        expect(tilPartRolle("BA", 10)).toBe("barn_under_18");
        expect(tilPartRolle("BA", 19)).toBe("barn_over_18");
    });

    test("BA uten kjent alder eller over maksalder lar saksbehandler velge", () => {
        expect(tilPartRolle("BA", null)).toBeNull();
        expect(tilPartRolle("BA", 40)).toBeNull();
    });

    test("uten rolle gir ingen rolle", () => {
        expect(tilPartRolle(undefined, 10)).toBeNull();
    });
});
