import type { PersonDto } from "@bidrag/api/PersonApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { Rolletype } from "@bidrag/api/SakApi";
import { describe, expect, it } from "vitest";
import type { BarnRolle } from "../sakvisning-schema.ts";
import { berikRoller } from "./useHentSakMedPersoninfo.ts";

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

    it("beregner alder og erMyndig=true for barn på 18 år eller eldre basert på fødselsdato", () => {
        const iDag = new Date();
        const fødselsdato = new Date(iDag.getFullYear() - 20, iDag.getMonth(), iDag.getDate())
            .toISOString()
            .slice(0, 10);

        const roller: RolleDto[] = [
            lagRolleDto({ fodselsnummer: "10987654321", type: Rolletype.BA, rolleType: Rolletype.BA }),
        ];
        const personInfoMap = new Map([["10987654321", lagPersonDto({ ident: "10987654321", fødselsdato })]]);

        const barn = berikRoller(roller, personInfoMap).at(0) as BarnRolle | undefined;

        expect(barn?.erMyndig).toBe(true);
        expect(barn?.alder).toBeGreaterThanOrEqual(18);
    });

    it("setter erMyndig=false for barn under 18 år", () => {
        const iDag = new Date();
        const fødselsdato = new Date(iDag.getFullYear() - 10, iDag.getMonth(), iDag.getDate())
            .toISOString()
            .slice(0, 10);

        const roller: RolleDto[] = [
            lagRolleDto({ fodselsnummer: "10987654321", type: Rolletype.BA, rolleType: Rolletype.BA }),
        ];
        const personInfoMap = new Map([["10987654321", lagPersonDto({ ident: "10987654321", fødselsdato })]]);

        const barn = berikRoller(roller, personInfoMap).at(0) as BarnRolle | undefined;

        expect(barn?.erMyndig).toBe(false);
    });

    it("setter reellMottakerType til 'barnet_selv' når reell mottaker er barnet selv", () => {
        const roller: RolleDto[] = [
            lagRolleDto({
                fodselsnummer: "10987654321",
                type: Rolletype.BA,
                rolleType: Rolletype.BA,
                reellMottaker: { ident: "10987654321", verge: false },
            }),
        ];

        const barn = berikRoller(roller, new Map()).at(0) as BarnRolle | undefined;

        expect(barn?.reellMottakerType).toBe("barnet_selv");
    });

    it("setter reellMottakerType til 'samhandler' når reell mottaker er en annen ident", () => {
        const roller: RolleDto[] = [
            lagRolleDto({
                fodselsnummer: "10987654321",
                type: Rolletype.BA,
                rolleType: Rolletype.BA,
                reellMottaker: { ident: "80000000001", verge: false },
            }),
        ];

        const barn = berikRoller(roller, new Map()).at(0) as BarnRolle | undefined;

        expect(barn?.reellMottakerType).toBe("samhandler");
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
