import { expect } from "chai";
export default class TableAssertion {
    assertTableExists() {
        expect(document.querySelector("table")).to.be.not.null;
        return this;
    }

    assertTableNotExists() {
        expect(document.querySelector("table")).to.be.null;
        return this;
    }

    assertNumberOfRows(expected: number) {
        expect(document.querySelector("table").querySelectorAll("tbody tr").length).to.be.eq(expected);
        return this;
    }

    assertNumberOfSelectedRows(expected: number) {
        expect(document.querySelectorAll("tbody tr.tabell__tr--valgt").length).to.be.eq(expected);
        return this;
    }
}
