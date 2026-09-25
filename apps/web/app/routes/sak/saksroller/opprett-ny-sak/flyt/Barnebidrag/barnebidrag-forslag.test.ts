import type { PersonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";
import { harFullstendigRelasjon, parterEtterValg, utledFellesBarn, utledForelderforslag } from "./barnebidrag-forslag";

const person = (ident: string, visningsnavn = ident): PersonDto => ({ ident, visningsnavn }) as PersonDto;
const far = person("11111111111", "Far");
const mor = person("22222222222", "Mor");
const annen = person("33333333333", "Annen");
const barn = { ident: "44444444444", navn: "Barn" };

describe("utledForelderforslag", () => {
    it("start fra barn: begge registrerte foreldre er forslag", () => {
        expect(utledForelderforslag({ foreldreTilBarn: [{ barn, foreldre: [far, mor] }], valgteIdenter: [] })).toEqual({
            forslag: [far, mor],
            feil: undefined,
        });
    });

    it("utelater låst forelder og foreldre som allerede er valgt", () => {
        const { forslag } = utledForelderforslag({
            foreldreTilBarn: [{ barn, foreldre: [far, mor] }],
            låstForelder: { ident: far.ident, navn: "Far" },
            valgteIdenter: [],
        });
        expect(forslag).toEqual([mor]);
        expect(
            utledForelderforslag({ foreldreTilBarn: [{ barn, foreldre: [far, mor] }], valgteIdenter: [far.ident] })
                .forslag,
        ).toEqual([mor]);
    });

    it("feil ved mer enn to foreldre", () => {
        expect(
            utledForelderforslag({ foreldreTilBarn: [{ barn, foreldre: [far, mor, annen] }], valgteIdenter: [] }).feil,
        ).toMatch(/flere enn 2 registrerte foreldre/);
    });

    it("advarer når barnet har to andre foreldre enn låst forelder", () => {
        expect(
            utledForelderforslag({
                foreldreTilBarn: [{ barn, foreldre: [mor, annen] }],
                låstForelder: { ident: far.ident, navn: "Far" },
                valgteIdenter: [],
            }).feil,
        ).toMatch(/Er du sikker på at dette er riktig barn/);
    });
});

describe("harFullstendigRelasjon", () => {
    it("er ukjent mens foreldreinfo lastes", () => {
        expect(harFullstendigRelasjon([{ barn, foreldre: undefined }], far.ident, mor.ident)).toBeUndefined();
    });

    it("krever at alle barn har både BP og BM registrert", () => {
        expect(harFullstendigRelasjon([{ barn, foreldre: [far, mor] }], far.ident, mor.ident)).toBe(true);
        expect(harFullstendigRelasjon([{ barn, foreldre: [far] }], far.ident, mor.ident)).toBe(false);
        expect(harFullstendigRelasjon([{ barn, foreldre: [far, mor] }], far.ident, undefined)).toBe(false);
    });
});

describe("utledFellesBarn", () => {
    const søsken = { ident: "55555555555", visningsnavn: "Søsken", fødselsdato: "2016-01-01" };
    const halvsøsken = { ident: "66666666666", visningsnavn: "Halvsøsken", fødselsdato: "2016-01-01" };
    const voksen = { ident: "77777777777", visningsnavn: "Voksen", fødselsdato: "1990-01-01" };
    const relasjoner = [
        { motpart: mor, fellesBarn: [{ ...barn, visningsnavn: "Barn", fødselsdato: "2015-01-01" }, søsken, voksen] },
        { motpart: annen, fellesBarn: [halvsøsken] },
    ] as never;

    it("gir bare barn med valgt BM, under maksalder, uten manuelt lagt til", () => {
        expect(utledFellesBarn(relasjoner, mor.ident, [barn.ident])?.fellesBarn.map((b) => b.ident)).toEqual([
            søsken.ident,
        ]);
    });

    it("gir ingenting uten kjent BM eller felles barn", () => {
        expect(utledFellesBarn(relasjoner, undefined, [])).toBeNull();
        expect(utledFellesBarn(relasjoner, far.ident, [])).toBeNull();
    });
});

describe("parterEtterValg", () => {
    const ikkeValgt = { ident: "", navn: "", erKjent: undefined };
    const part = (p: PersonDto) => ({
        ident: p.ident,
        navn: p.visningsnavn,
        erKjent: true,
        diskresjonskode: undefined,
    });

    it("fyller ut det andre kortet når ett forslag gjenstår", () => {
        const nye = parterEtterValg(
            { bidragspliktig: ikkeValgt, bidragsmottaker: ikkeValgt },
            "bidragspliktig",
            far,
            [far, mor],
            null,
        );
        expect(nye).toEqual({ bidragspliktig: part(far), bidragsmottaker: part(mor) });
    });

    it("bytter roller når personen står i det andre kortet", () => {
        const nye = parterEtterValg(
            { bidragspliktig: part(far), bidragsmottaker: part(mor) },
            "bidragspliktig",
            mor,
            [far, mor],
            null,
        );
        expect(nye).toEqual({ bidragspliktig: part(mor), bidragsmottaker: part(far) });
    });

    it("🔴 endrer aldri et låst kort", () => {
        const nye = parterEtterValg(
            { bidragspliktig: part(far), bidragsmottaker: ikkeValgt },
            "bidragsmottaker",
            mor,
            [mor, annen],
            "bidragspliktig",
        );
        expect(nye.bidragspliktig).toEqual(part(far));
    });

    it("beholder et ukjent kort", () => {
        const ukjent = { ...ikkeValgt, erKjent: false };
        const nye = parterEtterValg(
            { bidragspliktig: ikkeValgt, bidragsmottaker: ukjent },
            "bidragspliktig",
            far,
            [far, mor],
            null,
        );
        expect(nye.bidragsmottaker).toEqual(ukjent);
    });
});
