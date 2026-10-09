import { SletteUnderholdselementTypeEnum } from "@bidrag/api/BidragBehandlingApiV1";
import { describe, expect, it } from "vitest";

import { fieldNameToSletteUnderholdselementTypeEnum } from "../../barnebidrag/components/forms/underholdskostnad/UnderholdskostnadTabel";

// BARN slettes fra et eget endepunkt, ikke fra en periodetabell.
const periodetabeller = Object.values(SletteUnderholdselementTypeEnum).filter(
    (type) => type !== SletteUnderholdselementTypeEnum.BARN,
);

describe("Sletting av perioder under underholdskostnad", () => {
    it("har en oppføring for hver periodetype backend kan slette", () => {
        const mappede = Object.values(fieldNameToSletteUnderholdselementTypeEnum);
        expect(mappede).toEqual(expect.arrayContaining(periodetabeller));
    });

    it("mapper forpleining til riktig type", () => {
        expect(fieldNameToSletteUnderholdselementTypeEnum.forpleining).toBe(
            SletteUnderholdselementTypeEnum.FORPLEINING,
        );
    });

    it("slår ikke opp til undefined for noen periodetype", () => {
        for (const felt of Object.keys(fieldNameToSletteUnderholdselementTypeEnum)) {
            expect(fieldNameToSletteUnderholdselementTypeEnum[felt]).toBeDefined();
        }
    });
});
