import type { PersonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";
import { filtrerBortValgteForeldre } from "../../parter/part-utils";
import {
    harFullstendigRelasjon,
    harMotpartMedUlikeForelderroller,
    rollerEtterValg,
    utledBarnkurverForForelder,
    utledFellesBarn,
    utledForelderforslag,
} from "./barnebidrag-forslag";

const person = (ident: string, visningsnavn = ident): PersonDto => ({ ident, visningsnavn }) as PersonDto;
const far = person("11111111111", "Far");
const mor = person("22222222222", "Mor");
const annen = person("33333333333", "Annen");
const barn = { ident: "44444444444", navn: "Barn" };

describe("utledForelderforslag", () => {
    it("start fra barn: begge registrerte foreldre er forslag", () => {
        expect(utledForelderforslag({ foreldreTilBarn: [{ barn, foreldre: [far, mor] }], valgteForeldre: [] })).toEqual(
            {
                forslag: [far, mor],
                feil: undefined,
            },
        );
    });

    describe("filtrerBortValgteForeldre", () => {
        it("fjerner foreldre som allerede er valgt i et annet kort", () => {
            expect(filtrerBortValgteForeldre([far, mor, annen], [{ ident: far.ident }, { ident: undefined }])).toEqual([
                mor,
                annen,
            ]);
        });
    });

    it("feil ved mer enn to foreldre", () => {
        expect(
            utledForelderforslag({ foreldreTilBarn: [{ barn, foreldre: [far, mor, annen] }], valgteForeldre: [] }).feil,
        ).toMatch(/flere enn 2 registrerte foreldre/);
    });

    it("advarer når barnet har to andre foreldre enn en valgt forelder", () => {
        expect(
            utledForelderforslag({
                foreldreTilBarn: [{ barn, foreldre: [mor, annen] }],
                valgteForeldre: [{ ident: far.ident, navn: "Far" }],
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

describe("rollerEtterValg", () => {
    const ikkeValgt = { ident: "", navn: "", erKjent: undefined };
    const part = (p: PersonDto) => ({
        ident: p.ident,
        navn: p.visningsnavn,
        erKjent: true,
        diskresjonskode: undefined,
    });

    it("fyller ut det andre kortet når ett forslag gjenstår", () => {
        const nye = rollerEtterValg(
            [
                { ...ikkeValgt, type: "BP" },
                { ...ikkeValgt, type: "BM" },
            ],
            "bidragspliktig",
            far,
            [far, mor],
        );
        expect(nye).toEqual([
            { ...part(far), type: "BP" },
            { ...part(mor), type: "BM" },
        ]);
    });

    it("bytter roller når personen står i det andre kortet", () => {
        const nye = rollerEtterValg(
            [
                { ...part(far), type: "BP" },
                { ...part(mor), type: "BM" },
            ],
            "bidragspliktig",
            mor,
            [far, mor],
        );
        expect(nye).toEqual([
            { ...part(mor), type: "BP" },
            { ...part(far), type: "BM" },
        ]);
    });

    it("endrer ikke et utfylt kort", () => {
        const nye = rollerEtterValg(
            [
                { ...part(far), type: "BP" },
                { ...ikkeValgt, type: "BM" },
            ],
            "bidragsmottaker",
            mor,
            [mor, annen],
        );
        expect(nye.find((rolle) => rolle.type === "BP")).toEqual({ ...part(far), type: "BP" });
    });

    it("beholder et ukjent kort", () => {
        const ukjent = { ...ikkeValgt, erKjent: false };
        const nye = rollerEtterValg(
            [
                { ...ikkeValgt, type: "BP" },
                { ...ukjent, type: "BM" },
            ],
            "bidragspliktig",
            far,
            [far, mor],
        );
        expect(nye.find((rolle) => rolle.type === "BM")).toEqual({ ...ukjent, type: "BM" });
    });
});

describe("utledBarnkurverForForelder", () => {
    const barnMedAlder = (ident: string, fødselsdato: string) => ({ ...person(ident), fødselsdato }) as PersonDto;
    const ungtBarn = barnMedAlder("55555555555", "2015-01-01");
    const voksen = barnMedAlder("66666666666", "1990-01-01");

    it("slår sammen kurver med samme motpart og rolle og fjerner barn over 24 år", () => {
        expect(
            utledBarnkurverForForelder([
                { motpart: mor, forelderrolleMotpart: "MOR", fellesBarn: [ungtBarn, voksen] },
                { motpart: mor, forelderrolleMotpart: "MOR", fellesBarn: [ungtBarn] },
                { motpart: annen, forelderrolleMotpart: "MOR", fellesBarn: [voksen] },
            ]),
        ).toEqual([{ motpart: mor, forelderrolleMotpart: "MOR", fellesBarn: [ungtBarn, ungtBarn] }]);
    });
});

describe("harMotpartMedUlikeForelderroller", () => {
    it("oppdager samme motpart med ulike forelderroller", () => {
        expect(
            harMotpartMedUlikeForelderroller([
                { motpart: mor, forelderrolleMotpart: "MOR", fellesBarn: [] },
                { motpart: mor, forelderrolleMotpart: "FAR", fellesBarn: [] },
            ]),
        ).toBe(true);
    });
});
