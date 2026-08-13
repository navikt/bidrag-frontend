import type { TypeArManedsperiode } from "@bidrag/api/BelopshistorikkApi";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { beregnAntallMåneder, erDatoInnenforPeriode, erInnenforPeriode } from "./periode.utils";

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
        it("fra er åpen, til er åpen", () => {
            expect(erInnenforPeriode(undefined, undefined, periode)).toBe(true);
        });
        it("fra er før periode, til er åpen", () => {
            expect(erInnenforPeriode(new Date("2023-01-01"), undefined, periode)).toBe(true);
        });
        it("fra er innefor periode, til er åpen", () => {
            expect(erInnenforPeriode(new Date("2024-03-10"), undefined, periode)).toBe(true);
        });
        it("fra er etter periode, til er åpen", () => {
            expect(erInnenforPeriode(new Date("2025-03-10"), undefined, periode)).toBe(false);
        });

        it("fra er siste  i periode, til er åpen", () => {
            expect(erInnenforPeriode(new Date("2024-05-01"), undefined, periode)).toBe(true);
        });

        it("Fra er åpen, til er før periode", () => {
            expect(erInnenforPeriode(undefined, new Date("2024-05-10"), periode)).toBe(true);
        });

        it("Fra er åpen, til er innen periode", () => {
            expect(erInnenforPeriode(undefined, new Date("2024-05-10"), periode)).toBe(true);
        });

        it("Fra er åpen, til er etter periode", () => {
            expect(erInnenforPeriode(undefined, new Date("2025-01-01"), periode)).toBe(true);
        });

        it("Fra er åpen, til er siste peride", () => {
            expect(erInnenforPeriode(undefined, new Date("2024-06-01"), periode)).toBe(true);
        });

        it("fra er før, til er etter", () => {
            expect(erInnenforPeriode(new Date("2023-12-10"), new Date("2025-05-10"), periode)).toBe(true);
        });
        it("fra er før, til er innen", () => {
            expect(erInnenforPeriode(new Date("2023-12-10"), new Date("2024-05-01"), periode)).toBe(true);
        });

        it("intervall er helt før periode", () => {
            expect(erInnenforPeriode(new Date("2023-10-10"), new Date("2023-12-10"), periode)).toBe(false);
        });
        it("intervall er helt etter periode", () => {
            expect(erInnenforPeriode(new Date("2025-10-10"), new Date("2025-12-10"), periode)).toBe(false);
        });

        it("intervall en kun en måned på slutten", () => {
            expect(erInnenforPeriode(new Date("2024-05-01"), new Date("2024-05-30"), periode)).toBe(true);
        });


        it("fra tidenes morgen og til er innen intervall", () => {
            expect(erInnenforPeriode(undefined, new Date("2024-02-01"), periode)).toBe(true);
        });

        it("fra tidenes morgen  og til er før periode", () => {
            expect(erInnenforPeriode(undefined, new Date("2023-12-01"), periode)).toBe(false);
        });

        it("fra tidenes morgen  og til er etter periode", () => {
            expect(erInnenforPeriode(undefined, new Date("2025-12-01"), periode)).toBe(true);
        });

        it("fra tidenes morgen  og til er første måned i perioden", () => {
            expect(erInnenforPeriode(undefined, new Date("2024-01-01"), periode)).toBe(true);
        });

    });

    describe("beregnAntallMåneder", () => {
        it("teller måneder i lukket periode uten filter", () => {
            expect(
                beregnAntallMåneder(undefined, undefined, {
                    fom: "2024-01",
                    til: "2024-07",
                }),
            ).toBe(6);
        });

        it("teller én måned for samme fom og til", () => {
            expect(
                beregnAntallMåneder(undefined, undefined, {
                    fom: "2024-03",
                    til: "2024-03",
                }),
            ).toBe(0);
        });

        it("filteret klipper fra-siden av perioden", () => {
            expect(
                beregnAntallMåneder(new Date("2024-03-01"), undefined, {
                    fom: "2024-01",
                    til: "2024-06",
                }),
            ).toBe(3); // 2024-03 til 2024-06
        });

        it("filteret klipper til-siden av perioden", () => {
            expect(
                beregnAntallMåneder(undefined, new Date("2024-04-01"), {
                    fom: "2024-01",
                    til: "2024-06",
                }),
            ).toBe(4); // 2024-01 til 2024-04
        });

        it("filteret klipper begge ender", () => {
            expect(
                beregnAntallMåneder(new Date("2024-02-01"), new Date("2024-05-01"), { fom: "2024-01", til: "2024-06" }),
            ).toBe(4); // 2024-02 til 2024-05
        });

        it("returnerer 0 når filter er helt utenfor perioden", () => {
            expect(
                beregnAntallMåneder(new Date("2024-08-01"), new Date("2024-09-01"), { fom: "2024-01", til: "2024-06" }),
            ).toBe(0);
        });

        it("teller måneder for åpen periode (til=null) mot nå", () => {
            // Systemtid er satt til 2024-10-10 i beforeEach
            expect(
                beregnAntallMåneder(undefined, undefined, {
                    fom: "2024-08",
                    til: null,
                }),
            ).toBe(2); // 2024-08, 2024-09, 2024-10
        });
    });
});
