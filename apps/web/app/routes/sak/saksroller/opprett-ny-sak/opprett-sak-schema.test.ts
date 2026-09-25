import { describe, expect, it } from "vitest";
import { type BarnebidragSkjemaData, BarnebidragSkjemaSchema, EktefellebidragSkjemaSchema } from "./opprett-sak-schema";

const bp = "11111111111";
const bm = "22222222222";
const barnIdent = "33333333333";
const barn = { ident: barnIdent, navn: "Barn", alder: 8, erMyndig: false };
const kjent = (ident: string) => ({ ident, navn: ident, erKjent: true });

const gyldig: BarnebidragSkjemaData = {
    låstRolle: "bidragspliktig",
    søktIdent: bp,
    bidragspliktig: kjent(bp),
    bidragsmottaker: kjent(bm),
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
        expect(feilFor({ bidragsmottaker: kjent(bp) })).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: ["bidragsmottaker", "ident"],
                    message: "Samme person kan ikke være begge parter",
                }),
            ]),
        );
    });

    it("krever at forelder er registrert eller satt som ukjent", () => {
        expect(feilFor({ bidragsmottaker: { ident: "", navn: "" } })).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: ["bidragsmottaker", "ident"] })]),
        );
        expect(
            feilFor({
                bidragsmottaker: { ident: "", erKjent: false },
                valgteBarn: [{ ...barn, reellMottakerType: "barnet_selv" }],
            }),
        ).toEqual([]);
    });

    it("🔴 avviser at den oppsøkte personen flyttes til en annen rolle", () => {
        expect(feilFor({ bidragspliktig: kjent(bm), bidragsmottaker: kjent(bp) })).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: ["søktIdent"] })]),
        );
        expect(
            feilFor({
                låstRolle: "barn_under_18",
                søktIdent: barnIdent,
                valgteBarn: [{ ...barn, ident: "44444444444" }],
            }),
        ).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["søktIdent"] })]));
    });

    it("krever RM når BM er ukjent", () => {
        expect(feilFor({ bidragsmottaker: { ident: "", erKjent: false } })).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: ["valgteBarn", 0, "reellMottakerType"] })]),
        );
    });

    it("krever barn, unntatt når saken startes fra BM", () => {
        expect(feilFor({ valgteBarn: [] })).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: ["valgteBarn"] })]),
        );
        expect(feilFor({ låstRolle: "bidragsmottaker", søktIdent: bm, valgteBarn: [] })).toEqual([]);
    });
});

describe("EktefellebidragSkjemaSchema", () => {
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
