import { describe, expect, it } from "vitest";
import { filtrerSaksroller, type SaksrolleAlternativ } from "./saksrolle-regler";

const roller: SaksrolleAlternativ[] = [
    { label: "Bidragspliktig", value: "bidragspliktig" },
    { label: "Bidragsmottaker", value: "bidragsmottaker" },
    { label: "Barn over 18 år", value: "barn_over_18" },
    { label: "Barn under 18 år", value: "barn_under_18" },
];

const voksne = ["bidragspliktig", "bidragsmottaker"];

describe("filtrerSaksroller", () => {
    it.each([
        { alder: 17, sakstype: "EKTEFELLEBIDRAG", forventet: voksne },
        { alder: 17, sakstype: "BARNEBIDRAG", forventet: [...voksne, "barn_under_18"] },
        { alder: 18, sakstype: "BARNEBIDRAG", forventet: [...voksne, "barn_over_18"] },
        { alder: 24, sakstype: "BARNEBIDRAG", forventet: [...voksne, "barn_over_18"] },
        { alder: 25, sakstype: "BARNEBIDRAG", forventet: voksne },
        { alder: null, sakstype: "BARNEBIDRAG", forventet: roller.map((rolle) => rolle.value) },
    ])("$sakstype, alder $alder gir $forventet", ({ alder, sakstype, forventet }) => {
        expect(filtrerSaksroller(sakstype, alder, roller).map((rolle) => rolle.value)).toEqual(forventet);
    });
});
