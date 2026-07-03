import { afterEach, describe, expect, it, vi } from "vitest";

import { FnrObfuscator } from "./FnrObfuscator.ts";

describe("FnrObfuscator", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("enkoder og dekoder fødselsnummer tilbake til original verdi", () => {
        const obfuscater = new FnrObfuscator();
        const encoded = obfuscater.encode("12345678901");
        expect(encoded).not.toBe("12345678901");
        expect(obfuscater.decode(encoded)).toBe("12345678901");
    });

    it("bevarer ledende nuller ved dekoding", () => {
        const obfuscater = new FnrObfuscator();
        const encoded = obfuscater.encode("01234567890");
        expect(obfuscater.decode(encoded)).toBe("01234567890");
    });

    it("dekoder en kjent obfuskert verdi uten å bruke encode først", () => {
        const obfuscater = new FnrObfuscator();
        const obfuscatedFnr = "L3omtfKl"
        expect(obfuscater.decode(obfuscatedFnr)).toBe("12345678901");
    });

    it("gir ulik obfuskert verdi for samme fødselsnummer når salt varierer", () => {
        const obfuscater = new FnrObfuscator();
        vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.5);
        const firstEncoded = obfuscater.encode("12345678901");
        const secondEncoded = obfuscater.encode("12345678901");

        expect(firstEncoded).not.toBe(secondEncoded);
        expect(obfuscater.decode(firstEncoded)).toBe("12345678901");
        expect(obfuscater.decode(secondEncoded)).toBe("12345678901");
    });

    it("kaster feil når fødselsnummer inneholder andre tegn enn tall", () => {
        const obfuscater = new FnrObfuscator();
        expect(() => obfuscater.encode("1234abc")).toThrow(
            "Fnr must be a number",
        );
    });

    it("kaster feil når obfuskert verdi ikke kan dekodes", () => {
        const obfuscater = new FnrObfuscator();
        expect(() => obfuscater.decode("ugyldig-verdi")).toThrow(
            "Invalid obfuscated Fnr",
        );
    });
});

