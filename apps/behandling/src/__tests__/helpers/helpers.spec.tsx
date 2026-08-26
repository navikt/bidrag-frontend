import { describe, expect, it } from "vitest";

import { periodsAreOverlapping } from "../../forskudd/components/forms/helpers/helpers";

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe("Helpers", () => {
    it("should return true for overlapping periods", () => {
        const periodeA = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };
        const periodeB = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };

        const resultA = periodsAreOverlapping(periodeA, periodeB);
        expect(resultA).to.be.true;

        const periodeC = {
            datoFom: "2021-01-01",
            datoTom: null,
        };
        const periodeD = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };

        const resultB = periodsAreOverlapping(periodeC, periodeD);
        expect(resultB).to.be.true;

        const periodeE = {
            datoFom: "2021-01-01",
            datoTom: null,
        };
        const periodeF = {
            datoFom: "2021-01-01",
            datoTom: null,
        };

        const resultC = periodsAreOverlapping(periodeE, periodeF);
        expect(resultC).to.be.true;

        const periodeG = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };
        const periodeH = {
            datoFom: "2021-02-01",
            datoTom: null,
        };

        const resultD = periodsAreOverlapping(periodeG, periodeH);
        expect(resultD).to.be.true;

        const periodeI = {
            datoFom: "2021-03-01",
            datoTom: "2021-07-31",
        };
        const periodeJ = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };

        const resultE = periodsAreOverlapping(periodeI, periodeJ);
        expect(resultE).to.be.true;

        const periodeK = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };
        const periodeL = {
            datoFom: "2021-03-01",
            datoTom: "2021-07-31",
        };

        const resultF = periodsAreOverlapping(periodeK, periodeL);
        expect(resultF).to.be.true;
    });

    it("should return false for non-overlapping periods", () => {
        const periodeA = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };
        const periodeB = {
            datoFom: "2022-01-01",
            datoTom: "2022-12-31",
        };

        const resultA = periodsAreOverlapping(periodeA, periodeB);
        expect(resultA).to.be.false;

        const periodeC = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };
        const periodeD = {
            datoFom: "2022-01-01",
            datoTom: null,
        };

        const resultB = periodsAreOverlapping(periodeC, periodeD);
        expect(resultB).to.be.false;

        const periodeE = {
            datoFom: "2022-01-01",
            datoTom: null,
        };
        const periodeF = {
            datoFom: "2021-01-01",
            datoTom: "2021-12-31",
        };

        const resultC = periodsAreOverlapping(periodeE, periodeF);
        expect(resultC).to.be.false;
    });
});
