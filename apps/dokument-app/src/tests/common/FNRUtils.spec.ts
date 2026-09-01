import chai from "chai";

import FNRValidator from "../../common/utils/Validators";

describe("FNRUtils", () => {
    it("Should return false when a not valid FNR is provided", () => {
        // Given
        const unvalidFNR = "287176156223";

        // When
        const validFnrResult = FNRValidator.isValidFnr(unvalidFNR);

        // THen
        chai.assert.isFalse(validFnrResult);
    });

    it("Should return false when a value starts with 8", () => {
        // Given
        const unvalidFNR = "88717615622";

        // When
        const validFnrResult = FNRValidator.isValidFnr(unvalidFNR);

        // THen
        chai.assert.isFalse(validFnrResult);
    });

    it("Should return false when a not valid FNR is provided with text", () => {
        // Given
        const unvalidFNR = "kljauwyen87";

        // When
        const validFnrResult = FNRValidator.isValidFnr(unvalidFNR);

        // THen
        chai.assert.isFalse(validFnrResult);
    });

    it("Should return false when a not valid FNR is provided with more than eleven numbers", () => {
        // Given
        const unvalidFNR = "0122323471373371";

        // When
        const validFnrResult = FNRValidator.isValidFnr(unvalidFNR);

        // THen
        chai.assert.isFalse(validFnrResult);
    });

    it("Should return true when a valid FNR is provided", () => {
        // Given
        const unvalidFNR = "19910471373";

        // When
        const validFnrResult: boolean = FNRValidator.isValidFnr(unvalidFNR);

        // THen
        chai.assert.isTrue(validFnrResult);
    });

    it("Should return true when a valid FNR is syntetic id", () => {
        // Given
        const unvalidFNR = "28489220220";

        // When
        const validFnrResult: boolean = FNRValidator.isValidFnr(unvalidFNR);

        // THen
        chai.assert.isTrue(validFnrResult);
    });

    it("Should return true when a valid FNR is NPID", () => {
        // Given
        const unvalidFNR = "07318749759";

        // When
        const validFnrResult: boolean = FNRValidator.isValidFnr(unvalidFNR);

        // THen
        chai.assert.isTrue(validFnrResult);
    });
});
