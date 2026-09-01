import { describe, expect, it } from "vitest";
import { belopEllerStrek, datoEllerStrek, tekstEllerStrek } from "./innkrevingsformattering";

describe("innkrevingsformattering", () => {
    it("skal vise strek for tom eller manglende tekst", () => {
        expect(tekstEllerStrek(undefined)).toBe("-");
        expect(tekstEllerStrek(null)).toBe("-");
        expect(tekstEllerStrek("")).toBe("-");
        expect(tekstEllerStrek("   ")).toBe("-");
    });

    it("skal returnere tekst når verdi finnes", () => {
        expect(tekstEllerStrek("Vanlig giro")).toBe("Vanlig giro");
    });

    it("skal vise strek for manglende beløp", () => {
        expect(belopEllerStrek(undefined)).toBe("-");
        expect(belopEllerStrek(null)).toBe("-");
    });

    it("skal formatere beløp når verdi finnes", () => {
        expect(belopEllerStrek(12345.67)).toBe(
            new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(12345.67),
        );
    });

    it("skal vise strek for manglende dato", () => {
        expect(datoEllerStrek(undefined)).toBe("-");
        expect(datoEllerStrek(null)).toBe("-");
    });

    it("skal formatere dato når verdi finnes", () => {
        expect(datoEllerStrek("2026-08-31T00:00:00.000Z")).toBe("31.08.2026");
    });
});
