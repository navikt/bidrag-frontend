import { describe, expect, it } from "vitest";

import { skalRapportereEndring } from "./useEndringssporing.ts";

describe("skalRapportereEndring", () => {
    it("rapporterer en reell endring selv etter en dataoppdatering", () => {
        expect(skalRapportereEndring(true, true)).toBe(true);
    });

    it("ignorerer selve tilbakestillingen etter en dataoppdatering", () => {
        expect(skalRapportereEndring(false, true)).toBe(false);
    });

    it("rapporterer endringer når ingen tilbakestilling pågår", () => {
        expect(skalRapportereEndring(true, false)).toBe(true);
    });
});
