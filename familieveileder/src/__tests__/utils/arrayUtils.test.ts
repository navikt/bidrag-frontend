import { includesSomeElement } from "../../utils/arrayUtils";

describe("includesSomeElement", () => {
    it("returns true when at least one element overlaps", () => {
        expect(includesSomeElement(["a", "b"], ["c", "b"])).toBe(true);
    });

    it("returns false when no elements overlap", () => {
        expect(includesSomeElement(["a", "b"], ["c", "d"])).toBe(false);
    });

    it("returns false for empty arrays", () => {
        expect(includesSomeElement([], ["a"])).toBe(false);
        expect(includesSomeElement(["a"], [])).toBe(false);
    });

    it("handles empty string elements", () => {
        expect(includesSomeElement([""], [""])).toBe(true);
    });
});
