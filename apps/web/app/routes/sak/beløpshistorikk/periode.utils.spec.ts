import type { TypeArManedsperiode } from "@bidrag/api/BelopshistorikkApi";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { erDatoInnenforPeriode, erInnenforPeriode } from "./periode.utils";

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
            expect(
                erDatoInnenforPeriode(
                    new Date("2024-03-10"),
                    "2024-01",
                    "2024-06",
                ),
            ).toBe(true);
        });

        it("returnerer false når dato er før fom", () => {
            expect(
                erDatoInnenforPeriode(
                    new Date("2023-12-10"),
                    "2024-01",
                    "2024-06",
                ),
            ).toBe(false);
        });

        it("returnerer false når dato er etter tom", () => {
            expect(
                erDatoInnenforPeriode(
                    new Date("2024-07-01"),
                    "2024-01",
                    "2024-06",
                ),
            ).toBe(false);
        });

        it("returnerer true for åpen periode når dato er etter fom og før nå", () => {
            expect(
                erDatoInnenforPeriode(new Date("2024-08-01"), "2024-01", null),
            ).toBe(true);
        });

        it("returnerer false for åpen periode når dato er etter nå", () => {
            expect(
                erDatoInnenforPeriode(new Date("2024-11-01"), "2024-01", null),
            ).toBe(false);
        });
    });

    describe("erInnenforPeriode", () => {
        const periode: TypeArManedsperiode = {
            fom: "2024-01",
            til: "2024-06",
        };

        it("returnerer true når fra er innenfor periode", () => {
            expect(
                erInnenforPeriode(new Date("2024-03-10"), undefined, periode),
            ).toBe(true);
        });

        it("returnerer true når til er innenfor periode", () => {
            expect(
                erInnenforPeriode(undefined, new Date("2024-05-10"), periode),
            ).toBe(true);
        });

        it("returnerer true når fra er utenfor, men til er innenfor periode", () => {
            expect(
                erInnenforPeriode(
                    new Date("2023-12-10"),
                    new Date("2024-05-10"),
                    periode,
                ),
            ).toBe(true);
        });

        it("returnerer false når intervall er helt før periode", () => {
            expect(
                erInnenforPeriode(
                    new Date("2023-10-10"),
                    new Date("2023-12-10"),
                    periode,
                ),
            ).toBe(false);
        });

        it("returnerer true når fra er før periode og til er etter periode", () => {
            expect(
                erInnenforPeriode(
                    new Date("2023-12-10"),
                    new Date("2024-07-10"),
                    periode,
                ),
            ).toBe(true);
        });

        it("returnerer true når fra er null (fra tidenes morgen) og til overlapper", () => {
            expect(
                erInnenforPeriode(undefined, new Date("2024-02-01"), periode),
            ).toBe(true);
        });

        it("returnerer false når fra er null og til er før periode", () => {
            expect(
                erInnenforPeriode(undefined, new Date("2023-12-01"), periode),
            ).toBe(false);
        });

        it("returnerer true når til er null (nå) og fra overlapper periode", () => {
            expect(
                erInnenforPeriode(new Date("2024-05-01"), undefined, periode),
            ).toBe(true);
        });

        it("returnerer false når til er null (nå) og fra er etter nå", () => {
            expect(
                erInnenforPeriode(new Date("2024-11-01"), undefined, periode),
            ).toBe(false);
        });

        it("returnerer true når ingen filterdato er satt", () => {
            expect(erInnenforPeriode(undefined, undefined, periode)).toBe(
                true,
            );
        });

        it("returnerer true når periode.til er null og intervall overlapper", () => {
            expect(
                erInnenforPeriode(new Date("2024-08-01"), undefined, {
                    fom: "2024-01",
                    til: null,
                }),
            ).toBe(true);
        });
    });
});
