import { describe, expect, it } from "vitest";
import { generateCorrelationId } from "./CorrelationIdUtils";

describe("generateCorrelationId", () => {
    it("genererer en lesbar ID gruppert som 5 tegn-5 tegn", () => {
        expect(generateCorrelationId()).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/);
    });

    it("bruker ikke tegn som er lette å forveksle", () => {
        const ider = Array.from({ length: 200 }, () => generateCorrelationId()).join("");

        expect(ider).not.toMatch(/[ILOU]/);
    });

    it("genererer forskjellige korrelasjons-ID-er", () => {
        expect(generateCorrelationId()).not.toBe(generateCorrelationId());
    });
});
