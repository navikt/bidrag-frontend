import { describe, expect, it } from "vitest";
import { isValidDate, periodCoversMinOneFullCalendarMonth } from "../../utils/date-utils";

describe("DateUtils", () => {
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
