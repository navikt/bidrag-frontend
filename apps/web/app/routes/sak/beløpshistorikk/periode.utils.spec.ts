import type {TypeArManedsperiode} from "@bidrag/api/BelopshistorikkApi";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {beregnAntallMåneder, erDatoInnenforPeriode, erInnenforPeriode} from "./periode.utils";

class Filter {
    constructor(
        public fra: string | null = null,
        public til: string | null = null,
    ) {}

    fraDato(): Date | undefined {
        return this.fra ? new Date(this.fra) : undefined;
    }

    tilDato(): Date | undefined {
        return this.til ? new Date(this.til) : undefined;
    }
}

describe("periodeFilterUtils", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-10-10T00:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("erDatoInnenforPeriode", () => {
        it("returnerer true når dato er innenfor lukket periode", () => {
            expect(erDatoInnenforPeriode(new Date("2024-03-10"), "2024-01", "2024-06")).toBe(true);
        });

        it("returnerer false når dato er før fom", () => {
            expect(erDatoInnenforPeriode(new Date("2023-12-10"), "2024-01", "2024-06")).toBe(false);
        });

        it("returnerer true når dato er innen tom", () => {
            expect(erDatoInnenforPeriode(new Date("2023-12-10"), "2024-01", "2024-06")).toBe(false);
        });

        it("returnerer false når dato er etter tom", () => {
            expect(erDatoInnenforPeriode(new Date("2024-07-01"), "2024-01", "2024-06")).toBe(false);
        });

        it("returnerer true for åpen periode når dato er etter fom og før nå", () => {
            expect(erDatoInnenforPeriode(new Date("2024-08-01"), "2024-01", null)).toBe(true);
        });

        it("returnerer false for åpen periode når dato er etter nå", () => {
            expect(erDatoInnenforPeriode(new Date("2024-11-01"), "2024-01", null)).toBe(false);
        });
    });
    describe("erInnenforPeriode", () => {
        const periode: TypeArManedsperiode = {
            fom: "2024-01",
            til: "2024-06",
        };

        const tabell: Array<[string, Filter, boolean]> = [
            ["fra er åpen, til er åpen", new Filter(), true],
            ["fra er før periode, til er åpen", new Filter("2023-01-01"), true],
            ["fra er innenfor periode, til er åpen", new Filter("2024-03-10"), true],
            ["fra er etter periode, til er åpen", new Filter("2025-03-10"), false],
            ["fra er siste i periode, til er åpen", new Filter("2024-05-01"), true],
            ["fra er åpen, til er før periode", new Filter(null, "2024-05-10"), true],
            ["fra er åpen, til er innen periode", new Filter(null, "2024-05-10"), true],
            ["fra er åpen, til er etter periode", new Filter(null, "2025-01-01"), true],
            ["fra er åpen, til er siste periode", new Filter(null, "2024-06-01"), true],
            ["fra er før, til er etter", new Filter("2023-12-10", "2025-05-10"), true],
            ["fra er før, til er innen", new Filter("2023-12-10", "2024-05-01"), true],
            ["intervall er helt før periode", new Filter("2023-10-10", "2023-12-10"), false],
            ["intervall er helt etter periode", new Filter("2025-10-10", "2025-12-10"), false],
            ["intervall er kun en måned på slutten", new Filter("2024-05-01", "2024-05-30"), true],
            ["fra tidenes morgen og til er innen intervall", new Filter(null, "2024-02-01"), true],
            ["fra tidenes morgen og til er før periode", new Filter(null, "2023-12-01"), false],
            ["fra tidenes morgen og til er etter periode", new Filter(null, "2025-12-01"), true],
            ["fra tidenes morgen og til er første måned i perioden", new Filter(null, "2024-01-01"), true],
        ];

        it.each(tabell)("%s", (_beskrivelse, filter, forventet) => {
            expect(erInnenforPeriode(filter.fraDato(), filter.tilDato(), periode)).toBe(forventet);
        });
    });

    describe("beregnAntallMåneder", () => {
        // dagens dato er satt til 2024-10-10 i førEach ovenfor
        
        const tabell: Array<[string, Filter, TypeArManedsperiode, number]> = [
            ["lukket periode uten filter til og med", new Filter(), { fom: "2024-01", til: "2024-07" }, 6],
            ["lukket periode uten filter over nyttår", new Filter(), { fom: "2023-07", til: "2024-02" }, 7],
            ["lukket periode en måned", new Filter(), { fom: "2024-03", til: "2024-04" }, 1],
            ["samme fom og til", new Filter(), { fom: "2024-03", til: "2024-03" }, 0],
            ["lukket periode uten filter frem i tid", new Filter(), { fom: "2024-07", til: "2025-12" }, 4],
            ["åpen periode (til=null) mot nå", new Filter(), { fom: "2024-08", til: null }, 3],

            // Med filter
            ["filteret klipper fra-siden av perioden", new Filter("2024-03-01"), { fom: "2024-01", til: "2024-06" }, 3],
            ["filteret klipper til-siden av perioden", new Filter(null, "2024-04-01"), { fom: "2024-01", til: "2024-06" }, 4],
            ["filteret klipper begge ender", new Filter("2024-02-01", "2024-05-01"), { fom: "2024-01", til: "2024-06" }, 4],
            ["filter helt utenfor perioden", new Filter("2024-08-01", "2024-09-01"), { fom: "2024-01", til: "2024-06" }, 0],

        ];

        it.each(tabell)("%s", (_beskrivelse, filter, periode, forventet) => {
            expect(beregnAntallMåneder(filter.fraDato(), filter.tilDato(), periode)).toBe(forventet);
        });
    });
});
