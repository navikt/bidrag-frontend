import { Arbeidsfordeling, Rolletype } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import { lagOpprettSakRequest, type OpprettSakParter } from "./opprett-sak-request";

const BP = { ident: "11111111111" };
const BM = { ident: "22222222222" };
const BARN = { ident: "33333333333" };

const lag = (parter: Partial<OpprettSakParter>, arbeidsfordeling: "EEN" | "OPS" | "FRS" | "EFS" = "EEN") =>
    lagOpprettSakRequest("4806", arbeidsfordeling, { kategori: "Nasjonal", barn: [], ...parter });

const roller = (request: ReturnType<typeof lag>) => request.roller.map((r) => [r.type, r.fodselsnummer]);

describe("lagOpprettSakRequest", () => {
    it("bygger felles felter", () => {
        const request = lagOpprettSakRequest("4806", "EEN", { kategori: "Utland", barn: [] });
        expect(request).toMatchObject({
            eierfogd: "4806",
            kategori: "U",
            arbeidsfordeling: Arbeidsfordeling.EEN,
            ansatt: false,
            inhabilitet: false,
            levdeAdskilt: false,
        });
    });

    it("barnebidrag med kjente parter", () => {
        expect(roller(lag({ bidragspliktig: BP, bidragsmottaker: BM, barn: [BARN] }))).toEqual([
            [Rolletype.BP, BP.ident],
            [Rolletype.BM, BM.ident],
            [Rolletype.BA, BARN.ident],
        ]);
    });

    it.each([undefined, null, {}, { ident: "" }])("utelater ukjent BM (%j) og krever RM", (bidragsmottaker) => {
        expect(() => lag({ bidragspliktig: BP, bidragsmottaker, barn: [BARN] })).toThrow("reell mottaker");
    });

    it("ukjent BM med RM på barnet", () => {
        const request = lag({
            bidragspliktig: BP,
            bidragsmottaker: { ident: "" },
            barn: [{ ...BARN, reellMottaker: "44444444444" }],
        });
        expect(roller(request)).toEqual([
            [Rolletype.BP, BP.ident],
            [Rolletype.BA, BARN.ident],
        ]);
        expect(request.roller[1]?.reellMottaker).toEqual({ ident: "44444444444", verge: false });
    });

    it("ukjent BP sendes ikke", () => {
        expect(roller(lag({ bidragspliktig: { ident: "" }, bidragsmottaker: BM, barn: [BARN] }))).toEqual([
            [Rolletype.BM, BM.ident],
            [Rolletype.BA, BARN.ident],
        ]);
    });

    it("oppfostring: BP og barn med RM", () => {
        const request = lag({ bidragspliktig: BP, barn: [{ ...BARN, reellMottaker: "SAM123" }] }, "OPS");
        expect(request.arbeidsfordeling).toBe(Arbeidsfordeling.OPS);
        expect(roller(request)).toEqual([
            [Rolletype.BP, BP.ident],
            [Rolletype.BA, BARN.ident],
        ]);
    });

    it("ektefellebidrag: bare BP og BM", () => {
        expect(roller(lag({ bidragspliktig: BP, bidragsmottaker: BM }, "EFS"))).toEqual([
            [Rolletype.BP, BP.ident],
            [Rolletype.BM, BM.ident],
        ]);
    });
});
