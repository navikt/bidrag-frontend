import { Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { describe, expect, it } from "vitest";

import { getFomForPrivatAvtale } from "../../barnebidrag/components/forms/privatAvtale/PrivatAvtale";

describe("PrivatAvtaleFormHelpers", () => {
    it("should set fom limit to 1st of next month after birthday if Stonadstype is BIDRAG", () => {
        const fødselsdato = "2019-04-01";
        const expected = new Date("2019-04-01");
        const fom = getFomForPrivatAvtale(Stonadstype.BIDRAG, fødselsdato);
        expect(fom.toLocaleDateString()).equals(expected.toLocaleDateString());
    });

    it("should set fom limit to 1st of January 2012 if Stonadstype is BIDRAG and fødselsdato is before 2012", () => {
        const fødselsdato = "2011-04-01";
        const expected = new Date("2012-01-01");
        const fom = getFomForPrivatAvtale(Stonadstype.BIDRAG, fødselsdato);
        expect(fom.toLocaleDateString()).equals(expected.toLocaleDateString());
    });

    it("should set fom limit to 1st of next month after 18th birthday if Stonadstype is BIDRAG18AAR", () => {
        const fødselsdato = "2002-04-01";
        const expected = new Date("2020-05-01");
        const fom = getFomForPrivatAvtale(Stonadstype.BIDRAG18AAR, fødselsdato);
        expect(fom.toLocaleDateString()).equals(expected.toLocaleDateString());
    });

    it("should set fom limit to 1st of January 2012 if Stonadstype is BIDRAG18AAR and 18th birthday is before 2012", () => {
        const fødselsdato = "1980-04-01";
        const expected = new Date("2012-01-01");
        const fom = getFomForPrivatAvtale(Stonadstype.BIDRAG18AAR, fødselsdato);
        expect(fom.toLocaleDateString()).equals(expected.toLocaleDateString());
    });
});
