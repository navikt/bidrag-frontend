import type { PersonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";
import { slåSammenForeldreforslag, utledForeldreforslag } from "./utled-foreldreforslag";

const barn = { ident: "33333333333", visningsnavn: "Barn" } as PersonDto;
const partISaken = {
    ident: "11111111111",
    navn: "Part",
    rolle: "bidragspliktig" as const,
    erKjent: true,
};
const partISakenSomPerson = {
    ident: partISaken.ident,
    visningsnavn: partISaken.navn,
} as PersonDto;
const forelder = { ident: "22222222222", visningsnavn: "Forelder" } as PersonDto;

describe("utledForeldreforslag", () => {
    it("velger eneste mulige motpart automatisk", () => {
        const resultat = utledForeldreforslag({
            barn,
            foreldre: [partISakenSomPerson, forelder],
            motpart: { erKjent: false, rolle: "bidragsmottaker" },
            motpartErManueltValgt: false,
            partISaken,
        });

        expect(resultat.automatiskMotpart?.ident).toBe(forelder.ident);
        expect(resultat.forslag).toEqual([]);
    });

    it("overskriver ikke manuelt valgt motpart", () => {
        const resultat = utledForeldreforslag({
            barn,
            foreldre: [partISakenSomPerson, forelder],
            motpart: { ident: "44444444444", navn: "Valgt", erKjent: true, rolle: "bidragsmottaker" },
            motpartErManueltValgt: true,
            partISaken,
        });

        expect(resultat.automatiskMotpart).toBeUndefined();
        expect(resultat.infoMelding).toContain("Motparten endres ikke");
        expect(resultat.forslag).toHaveLength(1);
    });

    it("varsler når barnet har mer enn to registrerte foreldre", () => {
        const resultat = utledForeldreforslag({
            barn,
            foreldre: [
                partISakenSomPerson,
                forelder,
                { ident: "55555555555", visningsnavn: "Forelder to" } as PersonDto,
            ],
            motpart: { erKjent: false, rolle: "bidragsmottaker" },
            motpartErManueltValgt: false,
            partISaken,
        });

        expect(resultat.feil).toContain("flere enn 2 registrerte foreldre");
    });

    it("varsler når begge registrerte foreldre er andre enn parten", () => {
        const resultat = utledForeldreforslag({
            barn,
            foreldre: [forelder, { ident: "55555555555", visningsnavn: "Forelder to" } as PersonDto],
            motpart: { erKjent: false, rolle: "bidragsmottaker" },
            motpartErManueltValgt: false,
            partISaken,
        });

        expect(resultat.feil).toContain("har begge foreldre registrert");
    });
});

describe("slåSammenForeldreforslag", () => {
    it("beholder unike forslag på tvers av barn", () => {
        const forslag = { ...forelder, barnIdent: barn.ident, barnNavn: barn.visningsnavn };

        expect(slåSammenForeldreforslag([forslag], [forslag])).toEqual([forslag]);
    });
});
