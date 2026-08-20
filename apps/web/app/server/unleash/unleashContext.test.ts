import { describe, expect, it } from "vitest";
import { byggUnleashContext } from "./unleashContext.ts";

function url(query: string) {
    return new URL(`https://bidrag.intern.nav.no/unleash/proxy${query}`);
}

describe("byggUnleashContext", () => {
    it("setter userId og NAVident fra innlogget bruker", () => {
        const context = byggUnleashContext(url(""), "Z994977");
        expect(context.userId).toBe("Z994977");
        expect(context.properties?.NAVident).toBe("Z994977");
    });

    it("plukker opp saksnummer og enhet fra klientens properties", () => {
        const context = byggUnleashContext(url("?properties[saksnummer]=2300123&properties[enhet]=4806"), "Z994977");
        expect(context.properties).toMatchObject({ saksnummer: "2300123", enhet: "4806", NAVident: "Z994977" });
    });

    it("ignorerer properties som ikke er tillatt", () => {
        const context = byggUnleashContext(url("?properties[NAVident]=Z000000&properties[rolle]=admin"), "Z994977");
        expect(context.properties?.NAVident).toBe("Z994977");
        expect(context.properties?.rolle).toBeUndefined();
    });

    it("tar med sessionId når klienten sender den", () => {
        const context = byggUnleashContext(url("?sessionId=abc123"), undefined);
        expect(context.sessionId).toBe("abc123");
        expect(context.userId).toBeUndefined();
    });
});
