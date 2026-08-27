import type { SaksinformasjonBarn } from "@bidrag/api/BidragReskontroApi";
import { describe, expect, it } from "vitest";
import {
    beregnBarnGjeld,
    beregnBarnTilUtbetaling,
    beregnBmGjeld,
    beregnTotalGjeld,
    beregnTotalOffentligGjeld,
    beregnTotalPrivatGjeld,
    beregnTotaltTilUtbetaling,
} from "./gjeldsberegninger.ts";

function barn(overrides: Partial<SaksinformasjonBarn> = {}): SaksinformasjonBarn {
    return {
        personident: "12345678901",
        restGjeldOffentlig: 0,
        restGjeldPrivat: 0,
        sumIkkeUtbetalt: 0,
        sumForskuddUtbetalt: 0,
        ...overrides,
    };
}

describe("gjeldsberegninger", () => {
    it("beregner gjeld for ett barn", () => {
        expect(
            beregnBarnGjeld(
                barn({
                    restGjeldOffentlig: 120,
                    restGjeldPrivat: 80,
                }),
            ),
        ).toBe(200);
    });

    it("behandler manglende verdier som null", () => {
        expect(beregnBarnGjeld(barn({ restGjeldOffentlig: null, restGjeldPrivat: 50 }))).toBe(50);
        expect(beregnBarnTilUtbetaling(barn({ sumForskuddUtbetalt: undefined, sumIkkeUtbetalt: 25 }))).toBe(25);
    });

    it("summerer gjeld på tvers av barn", () => {
        const barnListe = [
            barn({ restGjeldOffentlig: 100, restGjeldPrivat: 10 }),
            barn({ restGjeldOffentlig: null, restGjeldPrivat: 20 }),
            barn({ restGjeldOffentlig: 40, restGjeldPrivat: null }),
        ];

        expect(beregnTotalGjeld(barnListe)).toBe(170);
        expect(beregnTotalPrivatGjeld(barnListe)).toBe(30);
        expect(beregnTotalOffentligGjeld(barnListe)).toBe(140);
    });

    it("summerer til utbetaling på tvers av barn", () => {
        const barnListe = [
            barn({ sumForskuddUtbetalt: 10, sumIkkeUtbetalt: 5 }),
            barn({ sumForskuddUtbetalt: null, sumIkkeUtbetalt: 7 }),
        ];

        expect(beregnTotaltTilUtbetaling(barnListe)).toBe(22);
    });

    it("summerer BMs gjeld", () => {
        expect(beregnBmGjeld(100, 25)).toBe(125);
        expect(beregnBmGjeld(undefined, 25)).toBe(25);
    });
});
