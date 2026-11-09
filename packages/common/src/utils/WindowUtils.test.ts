import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollToHash } from "./WindowUtils";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("scrollToHash", () => {
    it.each(["window", "document", "begge"])("gjør ingenting når %s mangler", (mangler) => {
        const getElementById = vi.fn();
        vi.stubGlobal("window", mangler === "document" ? { location: { hash: "#inntekt" } } : undefined);
        vi.stubGlobal("document", mangler === "window" ? { getElementById } : undefined);

        expect(() => scrollToHash()).not.toThrow();
        expect(getElementById).not.toHaveBeenCalled();
    });

    it("scroller til elementet angitt av hash", () => {
        const scrollIntoView = vi.fn();
        const getElementById = vi.fn().mockReturnValue({ scrollIntoView });
        vi.stubGlobal("window", { location: { hash: "#inntekt" } });
        vi.stubGlobal("document", { getElementById });

        scrollToHash();

        expect(getElementById).toHaveBeenCalledWith("inntekt");
        expect(scrollIntoView).toHaveBeenCalledWith(true);
    });

    it("slår ikke opp elementer uten hash", () => {
        const getElementById = vi.fn();
        vi.stubGlobal("window", { location: { hash: "" } });
        vi.stubGlobal("document", { getElementById });

        scrollToHash();

        expect(getElementById).not.toHaveBeenCalled();
    });

    it("tåler at elementet ikke finnes", () => {
        vi.stubGlobal("window", { location: { hash: "#inntekt" } });
        vi.stubGlobal("document", { getElementById: vi.fn().mockReturnValue(null) });

        expect(() => scrollToHash()).not.toThrow();
    });
});
