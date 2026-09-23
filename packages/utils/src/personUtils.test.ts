import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beregnAlderForPerson } from "./personUtils.ts";

describe("beregnAlderForPerson", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-09-21T12:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returnerer alder basert på fødselsdato når den finnes", () => {
        const person = { fødselsdato: "1999-01-01", ident: "01019900122" };
        expect(beregnAlderForPerson(person)).toBe(27);
    });

    it("returnerer alder fra ident når fødselsdato mangler", () => {
        const person = { ident: "01019900122" };
        expect(beregnAlderForPerson(person)).toBe(27);
    });

    it("returnerer alder fra ident når fødselsdato er null", () => {
        const person = { fødselsdato: null, ident: "01019900122" };
        expect(beregnAlderForPerson(person)).toBe(27);
    });

    it("returnerer alder fra ident når fødselsdato er tom streng", () => {
        const person = { fødselsdato: "", ident: "01019900122" };
        expect(beregnAlderForPerson(person)).toBe(27);
    });

    it("prioriterer fødselsdato over ident", () => {
        const person = { fødselsdato: "2010-06-15", ident: "01019900122" };
        expect(beregnAlderForPerson(person)).toBe(16);
    });

    it("returnerer null når verken fødselsdato eller ident er gyldig", () => {
        const person = { ident: "ugyldig" };
        expect(beregnAlderForPerson(person)).toBeNull();
    });

    it("returnerer null når ident er for kort", () => {
        const person = { ident: "1234567890" };
        expect(beregnAlderForPerson(person)).toBeNull();
    });
});
