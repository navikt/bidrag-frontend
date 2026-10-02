import { describe, expect, it } from "vitest";
import { bisysSakUrl } from "./bisys-lenker";

describe("bisysSakUrl", () => {
    it("tar med sessionState fra gjeldende URL", () => {
        expect(bisysSakUrl("soknad", "2400001", "?sessionState=abc&enhet=4806")).toBe(
            "/bisys/soknad?saksnr=2400001&sessionState=abc",
        );
    });

    it("utelater sessionState når den mangler", () => {
        expect(bisysSakUrl("sak", "2400001", "")).toBe("/bisys/sak?saksnr=2400001");
    });
});
