import { describe, expect, it } from "vitest";
import { filtrerSaksroller, type SaksrolleAlternativ } from "./saksrolle-regler";

const roller: SaksrolleAlternativ[] = [
    { label: "Bidragspliktig", value: "bidragspliktig" },
    { label: "Bidragsmottaker", value: "bidragsmottaker" },
    { label: "Barn over 18 år", value: "barn_over_18" },
    { label: "Barn under 18 år", value: "barn_under_18" },
];

const verdier = (alder: number | null, sakstype: string | null = "BARNEBIDRAG") =>
    filtrerSaksroller(sakstype, alder, roller).map((rolle) => rolle.value);

describe("filtrerSaksroller", () => {
    it("viser bare voksenroller for ektefellebidrag", () => {
        expect(verdier(17, "EKTEFELLEBIDRAG")).toEqual(["bidragspliktig", "bidragsmottaker"]);
    });

    it("viser barnerolle under 18 år til og med siste dag som mindreårig", () => {
        expect(verdier(17)).toEqual(["bidragspliktig", "bidragsmottaker", "barn_under_18"]);
    });

    it("viser barnerolle over 18 år fra myndighetsalder til maksimal barnalder", () => {
        expect(verdier(18)).toEqual(["bidragspliktig", "bidragsmottaker", "barn_over_18"]);
        expect(verdier(24)).toEqual(["bidragspliktig", "bidragsmottaker", "barn_over_18"]);
    });

    it("skjuler barneroller over maksimal barnalder", () => {
        expect(verdier(25)).toEqual(["bidragspliktig", "bidragsmottaker"]);
    });

    it("beholder alle roller når alder er ukjent", () => {
        expect(verdier(null)).toEqual(roller.map((rolle) => rolle.value));
    });
});
