import { Arbeidsfordeling, Rolletype } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import { lagOpprettSakRequest, type OpprettSakParter } from "./opprett-sak-request";

const BP = { ident: "11111111111" };
const BM = { ident: "22222222222" };
const BARN = { ident: "33333333333" };

const lag = (roller: OpprettSakParter["roller"]) =>
    lagOpprettSakRequest("4806", "EEN", { kategori: "Nasjonal", roller });

const roller = (request: ReturnType<typeof lag>) => request.roller.map((r) => [r.type, r.fodselsnummer]);

describe("lagOpprettSakRequest", () => {
    it("bygger felles felter", () => {
        const request = lagOpprettSakRequest("4806", "EEN", { kategori: "Utland", roller: [] });
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
        expect(
            roller(
                lag([
                    { type: Rolletype.BP, fodselsnummer: BP.ident },
                    { type: Rolletype.BM, fodselsnummer: BM.ident },
                    { type: Rolletype.BA, fodselsnummer: BARN.ident },
                ]),
            ),
        ).toEqual([
            [Rolletype.BP, BP.ident],
            [Rolletype.BM, BM.ident],
            [Rolletype.BA, BARN.ident],
        ]);
    });

    it.each([undefined, null, {}, { ident: "" }])("utelater ukjent BM (%j) og krever RM", (bidragsmottaker) => {
        expect(() =>
            lag([
                { type: Rolletype.BP, fodselsnummer: BP.ident },
                { type: Rolletype.BM, fodselsnummer: bidragsmottaker?.ident },
                { type: Rolletype.BA, fodselsnummer: BARN.ident },
            ]),
        ).toThrow("reell mottaker");
    });

    it("ukjent BM med RM på barnet", () => {
        const request = lag([
            { type: Rolletype.BP, fodselsnummer: BP.ident },
            { type: Rolletype.BM, fodselsnummer: "" },
            {
                type: Rolletype.BA,
                fodselsnummer: BARN.ident,
                reellMottaker: { ident: "44444444444", verge: false },
            },
        ]);
        expect(roller(request)).toEqual([
            [Rolletype.BP, BP.ident],
            [Rolletype.BA, BARN.ident],
        ]);
        expect(request.roller[1]?.reellMottaker).toEqual({ ident: "44444444444", verge: false });
    });

    it("utelater ukjent BP", () => {
        expect(
            roller(
                lag([
                    { type: Rolletype.BP, fodselsnummer: "" },
                    { type: Rolletype.BM, fodselsnummer: BM.ident },
                    { type: Rolletype.BA, fodselsnummer: BARN.ident },
                ]),
            ),
        ).toEqual([
            [Rolletype.BM, BM.ident],
            [Rolletype.BA, BARN.ident],
        ]);
    });
});
