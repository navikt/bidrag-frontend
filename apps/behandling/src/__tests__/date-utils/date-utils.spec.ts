import { describe, expect, it } from "vitest";
import { addMonthsIgnoreDay, isValidDate, periodCoversMinOneFullCalendarMonth } from "../../utils/date-utils";

describe("DateUtils", () => {
    describe("addMonthsIgnoreDay", () => {
        it.each([
            { input: "2026-01-31", months: 1, expected: new Date(2026, 1, 1) },
            { input: "2024-01-31", months: 1, expected: new Date(2024, 1, 1) },
            { input: "2026-12-31", months: 1, expected: new Date(2027, 0, 1) },
            { input: "2026-01-31", months: 3, expected: new Date(2026, 3, 1) },
            { input: "2026-03-31", months: -1, expected: new Date(2026, 1, 1) },
            { input: "2026-01-31", months: 0, expected: new Date(2026, 0, 1) },
        ])("adds $months months to $input without overflowing the target month", ({ input, months, expected }) => {
            expect(addMonthsIgnoreDay(input, months)).toEqual(expected);
            expect(addMonthsIgnoreDay(new Date(input), months)).toEqual(expected);
        });

        it("does not mutate the original Date", () => {
            const input = new Date(2026, 0, 31, 12, 30);
            const originalTime = input.getTime();

            expect(addMonthsIgnoreDay(input, 1)).toEqual(new Date(2026, 1, 1));
            expect(input.getTime()).toBe(originalTime);
        });
    });

    it("isValidDate should return false for null", () => {
        const isValid = isValidDate(null);
        expect(isValid).equals(false);
    });

    it("isValidDate should return false for undefined", () => {
        const isValid = isValidDate(undefined);
        expect(isValid).equals(false);
    });

    it("isValidDate should return true for Date object", () => {
        const isValid = isValidDate(new Date());
        expect(isValid).equals(true);
    });

    it("periodCoversAtLeastOneWholeMonth should return true for periods that cover at least one whole month", () => {
        const validPeriods = [
            {
                start: new Date("2020.10.01"),
                end: new Date("2020.10.31"),
            },
            {
                start: new Date("2020.10.10"),
                end: new Date("2020.12.10"),
            },
            {
                start: new Date("2020.11.10"),
                end: new Date("2021.01.10"),
            },
            {
                start: new Date("2020.12.10"),
                end: new Date("2021.01.31"),
            },
            {
                start: new Date("2020.12.10"),
                end: new Date("2021.03.31"),
            },
            {
                start: new Date("2020.12.10"),
                end: new Date("2022.12.10"),
            },
            {
                start: new Date("2020.01.01"),
                end: new Date("2022.01.01"),
            },
        ];

        validPeriods.forEach(({ start, end }) => {
            const periodIsAtLeastOneWholeMonthLong = periodCoversMinOneFullCalendarMonth(start, end);
            expect(periodIsAtLeastOneWholeMonthLong).equals(true);
        });
    });

    it("periodCoversAtLeastOneWholeMonth should return false for periods that are not covering at least one whole month", () => {
        const invalidPeriods = [
            {
                start: new Date("2020.10.02"),
                end: new Date("2020.10.25"),
            },
            {
                start: new Date("2020.10.01"),
                end: new Date("2020.10.25"),
            },
            {
                start: new Date("2020.10.10"),
                end: new Date("2020.10.31"),
            },
            {
                start: new Date("2020.12.10"),
                end: new Date("2021.01.10"),
            },
        ];

        invalidPeriods.forEach(({ start, end }) => {
            const periodIsAtLeastOneWholeMonthLong = periodCoversMinOneFullCalendarMonth(start, end);
            expect(periodIsAtLeastOneWholeMonthLong).equals(false);
        });
    });
});
