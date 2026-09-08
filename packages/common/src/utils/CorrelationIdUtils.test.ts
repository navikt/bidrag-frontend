import { describe, expect, it } from "vitest";
import { generateCorrelationId } from "./CorrelationIdUtils";

describe("generateCorrelationId", () => {
    it("genererer en 16 tegn lang URL-sikker korrelasjons-ID", () => {
        expect(generateCorrelationId()).toMatch(/^[A-Za-z0-9_-]{16}$/);
    });

    it("genererer forskjellige korrelasjons-ID-er", () => {
        expect(generateCorrelationId()).not.toBe(generateCorrelationId());
    });
});
