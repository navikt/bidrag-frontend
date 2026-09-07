import { describe, expect, it } from "vitest";
import { nullSafeNumber, numberAsString } from "./NumberUtils.ts";

describe("nullSafeNumber", () => {
    it("returnerer null for null og undefined", () => {
        expect(nullSafeNumber(null)).toBeNull();
        expect(nullSafeNumber(undefined)).toBeNull();
        expect(nullSafeNumber()).toBeNull();
    });

    it("returnerer tall-input uendret", () => {
        expect(nullSafeNumber(123)).toBe(123);
        expect(nullSafeNumber(0)).toBe(0);
        expect(nullSafeNumber(-5)).toBe(-5);
    });

    it("parser gyldige heltallsstrenger", () => {
        expect(nullSafeNumber("123")).toBe(123);
        expect(nullSafeNumber("  123  ")).toBe(123);
        expect(nullSafeNumber("0")).toBe(0);
        expect(nullSafeNumber("-5")).toBe(-5);
        expect(nullSafeNumber("12.5")).toBe(12.5);
    });

    it("returnerer null for strenger som ikke er ett heltall", () => {
        expect(nullSafeNumber("abc")).toBeNull();
        expect(nullSafeNumber("")).toBeNull();
        expect(nullSafeNumber("123..123")).toBeNull();
        expect(nullSafeNumber("33,5")).toBeNull();
    });
});

describe("numberAsString", () => {
    it("returnerer null for null og undefined", () => {
        expect(numberAsString(null)).toBeNull();
        expect(numberAsString(undefined)).toBeNull();
        expect(numberAsString()).toBeNull();
    });

    it("returnerer streng-input uendret", () => {
        expect(numberAsString("123")).toBe("123");
        expect(numberAsString("abc")).toBe("abc");
        expect(numberAsString("")).toBe("");
    });

    it("konverterer tall til streng", () => {
        expect(numberAsString(123)).toBe("123");
        expect(numberAsString(0)).toBe("0");
        expect(numberAsString(-5)).toBe("-5");
    });
});
