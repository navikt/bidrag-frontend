import { describe, expect, it } from "vitest";
import { type BarnebidragSkjemaData, BarnebidragSkjemaSchema, EktefellebidragSkjemaSchema } from "./opprett-sak-schema";

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
            partISaken: { ident: "", navn: "", rolle: "bidragspliktig", erKjent: true },
            motpart: { ident: bm, navn: "Andre", rolle: "bidragsmottaker", erKjent: true },
            kategori: "Nasjonal",
        });
        expect(resultat.error?.issues[0]).toEqual(
            expect.objectContaining({ path: ["partISaken", "ident"], message: "Du må registrere bidragspliktig" }),
        );
    });

    it("avviser samme person som begge parter", () => {
        const resultat = EktefellebidragSkjemaSchema.safeParse({
            arbeidsfordeling: "EFS",
            partISaken: { ident: bp, navn: "Første", rolle: "bidragspliktig", erKjent: true },
            motpart: { ident: bp, navn: "Andre", rolle: "bidragsmottaker", erKjent: true },
            kategori: "Nasjonal",
        });
        expect(resultat.error?.issues[0]).toEqual(
            expect.objectContaining({ path: ["motpart", "ident"], message: "Samme person kan ikke være begge parter" }),
        );
    });
});
