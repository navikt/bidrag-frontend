import { describe, expect, it } from "vitest";
import {
    type BarnebidragSkjemaData,
    BarnebidragSkjemaSchema,
    EktefellebidragSkjemaSchema,
    FarskapsSkjemaSchema,
    OppfostringsbidragSkjemaSchema,
} from "./opprett-sak-schema";

const bp = "11111111111";
const bm = "22222222222";
const barnIdent = "33333333333";
const barn = { ident: barnIdent, navn: "Barn", alder: 8, erMyndig: false };
const kjent = (ident: string) => ({ ident, navn: ident, erKjent: true });

const gyldig: BarnebidragSkjemaData = {
    roller: [
        { ...kjent(bp), type: "BP" },
        { ...kjent(bm), type: "BM" },
    ],
    valgteBarn: [barn],
    kategori: "Nasjonal",
};

const feilFor = (data: Partial<BarnebidragSkjemaData>) =>
    BarnebidragSkjemaSchema.safeParse({ ...gyldig, ...data }).error?.issues ?? [];

describe("BarnebidragSkjemaSchema", () => {
    it("godtar kjente parter og ett barn", () => {
        expect(BarnebidragSkjemaSchema.safeParse(gyldig).success).toBe(true);
    });

    it("avviser samme person som BP og BM", () => {
        expect(
            feilFor({
                roller: [
                    { ...kjent(bp), type: "BP" },
                    { ...kjent(bp), type: "BM" },
                ],
            }),
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: ["roller", 1, "ident"],
                    message: "Samme person kan ikke være begge parter",
                }),
            ]),
        );
    });

    it("krever at forelder er registrert eller satt som ukjent", () => {
        expect(
            feilFor({
                roller: [
                    { ...kjent(bp), type: "BP" },
                    { ident: "", navn: "", type: "BM" },
                ],
            }),
        ).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["roller", 1, "ident"] })]));
        expect(
            feilFor({
                roller: [
                    { ...kjent(bp), type: "BP" },
                    { ident: "", erKjent: false, type: "BM" },
                ],
                valgteBarn: [{ ...barn, reellMottakerType: "barnet_selv" }],
            }),
        ).toEqual([]);
    });

    it("lar partene bytte roller", () => {
        expect(
            feilFor({
                roller: [
                    { ...kjent(bm), type: "BP" },
                    { ...kjent(bp), type: "BM" },
                ],
            }),
        ).toEqual([]);
    });

    it("validerer roller uavhengig av rekkefølgen i listen", () => {
        expect(
            BarnebidragSkjemaSchema.safeParse({
                ...gyldig,
                roller: [
                    { ...kjent(bm), type: "BM" },
                    { ...kjent(bp), type: "BP" },
                ],
            }).success,
        ).toBe(true);
    });

    it("krever RM når BM er ukjent", () => {
        expect(
            feilFor({
                roller: [
                    { ...kjent(bp), type: "BP" },
                    { ident: "", erKjent: false, type: "BM" },
                ],
            }),
        ).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["valgteBarn", 0, "reellMottakerType"] })]));
    });

    it("krever barn, unntatt når BM er kjent", () => {
        expect(feilFor({ valgteBarn: [] })).toEqual([]);
        expect(
            feilFor({
                roller: [
                    { ...kjent(bp), type: "BP" },
                    { ident: "", erKjent: false, type: "BM" },
                ],
                valgteBarn: [],
            }),
        ).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["valgteBarn"] })]));
    });
});

describe("EktefellebidragSkjemaSchema", () => {
    it("krever parten i saken", () => {
        const resultat = EktefellebidragSkjemaSchema.safeParse({
            arbeidsfordeling: "EFS",
            roller: [
                { ident: "", navn: "", type: "BP", erKjent: true },
                { ident: bm, navn: "Andre", type: "BM", erKjent: true },
            ],
            kategori: "Nasjonal",
        });
        expect(resultat.error?.issues[0]).toEqual(
            expect.objectContaining({ path: ["roller", 0, "ident"], message: "Du må registrere bidragspliktig" }),
        );
    });

    it("avviser samme person som begge parter", () => {
        const resultat = EktefellebidragSkjemaSchema.safeParse({
            arbeidsfordeling: "EFS",
            roller: [
                { ident: bp, navn: "Første", type: "BP", erKjent: true },
                { ident: bp, navn: "Andre", type: "BM", erKjent: true },
            ],
            kategori: "Nasjonal",
        });
        expect(resultat.error?.issues[0]).toEqual(
            expect.objectContaining({
                path: ["roller", 1, "ident"],
                message: "Samme person kan ikke være begge parter",
            }),
        );
    });
});

describe("EnPartMedBarn-skjemaene", () => {
    const roller = [
        { ident: bp, navn: "Part", type: "BP" as const, erKjent: true },
        { ident: "", navn: "", type: "BM" as const, erKjent: false },
    ];

    it("godtar farskap med én kjent part og barn", () => {
        expect(
            FarskapsSkjemaSchema.safeParse({
                arbeidsfordeling: "FRS",
                roller,
                valgteBarn: [barn],
                kategori: "Nasjonal",
            }).success,
        ).toBe(true);
    });

    it("krever reell mottaker for oppfostringsbidrag", () => {
        const resultat = OppfostringsbidragSkjemaSchema.safeParse({
            arbeidsfordeling: "OPS",
            roller,
            valgteBarn: [barn],
            kategori: "Nasjonal",
        });
        expect(resultat.error?.issues).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: ["valgteBarn", 0, "reellMottakerType"] })]),
        );
    });
});
