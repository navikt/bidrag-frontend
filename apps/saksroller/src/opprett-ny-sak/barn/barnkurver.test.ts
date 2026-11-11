import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";
import { grupperBarnIKurver } from "./barnkurver";

describe("grupperBarnIKurver", () => {
    it("utelater barn over 24 år og barn med ukjent alder", () => {
        const barn = (ident: string, fødselsdato?: string) =>
            ({ ident, visningsnavn: ident, fødselsdato }) as PersonDto;
        const relasjon = {
            fellesBarn: [barn("11111111111", "2015-01-01"), barn("22222222222", "1900-01-01"), barn("33333333333")],
        } as MotpartBarnRelasjon;

        expect(grupperBarnIKurver([relasjon])[0]?.barn.map(({ ident }) => ident)).toEqual(["11111111111"]);
    });
});
