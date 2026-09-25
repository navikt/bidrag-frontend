import type { PersonDto } from "@bidrag/api/PersonApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import type { BarnRolle } from "../sakvisning-schema.ts";
import { berikRoller } from "./rolleberikelse.ts";

function lagRolleDto(overrides: Partial<RolleDto>): RolleDto {
    return {
        type: Rolletype.BM,
        rolleType: Rolletype.BM,
        mottagerErVerge: false,
        rollehistorikk: [],
        ...overrides,
    };
}

function lagPersonDto(overrides: Partial<PersonDto>): PersonDto {
    return {
        ident: "10987654321",
        visningsnavn: "Ola Nordmann",
        ...overrides,
    };
}

describe("berikRoller", () => {
    it("normaliserer null-felter (objektnummer, reellMottager, foedselsnummer) til hhv. tom streng/undefined", () => {
        const roller: RolleDto[] = [
            lagRolleDto({
                fodselsnummer: "11111111111",
                type: Rolletype.BM,
                rolleType: Rolletype.BM,
                objektnummer: null,
                reellMottager: null,
                foedselsnummer: null,
            }),
        ];

        const resultat = berikRoller(roller, new Map()).at(0);

        expect(resultat).toBeDefined();

        expect(resultat?.objektnummer).toBe("");
        expect(resultat?.reellMottager).toBeUndefined();
        expect(resultat?.foedselsnummer).toBeUndefined();
    });

    it.each([
        { år: 20, erMyndig: true },
        { år: 10, erMyndig: false },
    ])("barn født for $år år siden får erMyndig=$erMyndig og beregnet alder", ({ år, erMyndig }) => {
        const iDag = new Date();
        const fødselsdato = new Date(iDag.getFullYear() - år, iDag.getMonth(), iDag.getDate())
            .toISOString()
            .slice(0, 10);

        const roller: RolleDto[] = [
            lagRolleDto({ fodselsnummer: "10987654321", type: Rolletype.BA, rolleType: Rolletype.BA }),
        ];
        const personInfoMap = new Map([["10987654321", lagPersonDto({ ident: "10987654321", fødselsdato })]]);

        const barn = berikRoller(roller, personInfoMap).at(0) as BarnRolle | undefined;

        expect(barn?.erMyndig).toBe(erMyndig);
        expect(barn?.alder).toBe(år);
    });

    it.each([
        { reellMottakerIdent: "10987654321", forventet: "barnet_selv" },
        { reellMottakerIdent: "80000000001", forventet: "samhandler" },
    ])("reell mottaker $reellMottakerIdent gir reellMottakerType=$forventet", ({ reellMottakerIdent, forventet }) => {
        const roller: RolleDto[] = [
            lagRolleDto({
                fodselsnummer: "10987654321",
                type: Rolletype.BA,
                rolleType: Rolletype.BA,
                reellMottaker: { ident: reellMottakerIdent, verge: false },
            }),
        ];

        const barn = berikRoller(roller, new Map()).at(0) as BarnRolle | undefined;

        expect(barn?.reellMottakerType).toBe(forventet);
    });

    it("beriker forelder-roller (BP/BM) med navn og fødselsdato, men uten barn-spesifikke felter", () => {
        const roller: RolleDto[] = [
            lagRolleDto({ fodselsnummer: "11111111111", type: Rolletype.BM, rolleType: Rolletype.BM }),
        ];
        const personInfoMap = new Map([
            ["11111111111", lagPersonDto({ ident: "11111111111", visningsnavn: "Kari Nordmann" })],
        ]);

        const forelder = berikRoller(roller, personInfoMap).at(0) as BarnRolle | undefined;

        expect(forelder?.navn).toBe("Kari Nordmann");
        expect(forelder?.erMyndig).toBeUndefined();
    });

    it("sorterer roller på fødselsnummer, deretter type", () => {
        const roller: RolleDto[] = [
            lagRolleDto({ fodselsnummer: "22222222222", type: Rolletype.BP, rolleType: Rolletype.BP }),
            lagRolleDto({ fodselsnummer: "11111111111", type: Rolletype.BM, rolleType: Rolletype.BM }),
        ];

        const resultat = berikRoller(roller, new Map());

        expect(resultat.map((r) => r.fodselsnummer)).toEqual(["11111111111", "22222222222"]);
    });
});
