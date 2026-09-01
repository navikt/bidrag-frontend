import { assert, expect } from "chai";

import { formatDate } from "../../common/utils/DateUtils";

describe("Date format utils", () => {
    it("should format date with (-) delimiter", () => {
        // GIVEN
        const givenTestDate = "2001-01-01";
        const dateFormat = "YYYY-MM-DD";

        // WHEN
        const formatedData = formatDate(givenTestDate, dateFormat);
        // THEN
        assert.equal(formatedData, "2001-01-01");
    });

    it("should accept and return same date because it is a valid date format without delimiters", () => {
        // GIVEN
        const givenTestDate = "010101";

        // WHEN
        const formatedData = formatDate(givenTestDate);
        // THEN
        assert.equal(formatedData, "01.01.2001");
    });

    it("should return nothing when date is null", () => {
        // GIVEN
        const givenTestDate = null;

        // WHEN
        const formatedData = formatDate(givenTestDate);
        // THEN
        assert.equal(formatedData, null);
    });

    it("should leave user input unchanged on invalid date", () => {
        // GIVEN
        const givenTestDate = " ";
        // WHEN
        const oppgittDato = formatDate(givenTestDate);
        expect(oppgittDato).to.eq(givenTestDate);
    });
});
