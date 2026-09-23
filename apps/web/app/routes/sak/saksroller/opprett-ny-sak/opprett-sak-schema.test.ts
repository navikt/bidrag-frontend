import { describe, expect, it } from "vitest";
import {
    BarnBeggForeldreSkjemaSchema,
    BarnMedManglendeForeldreSkjemaSchema,
    EktefellebidragSkjemaSchema,
    ForelderMedBarnSkjemaSchema,
} from "./opprett-sak-schema";

const ident = "11111111111";
const annenIdent = "22222222222";

describe("partsvalidering", () => {
    it("avviser samme person som part i saken og motpart", () => {
        const resultat = ForelderMedBarnSkjemaSchema.safeParse({
            partISaken: {
                ident,
                navn: "Første part",
                rolle: "bidragsmottaker",
                erKjent: true,
            },
            motpart: {
                ident,
                navn: "Andre part",
                rolle: "bidragspliktig",
                erKjent: true,
            },
            valgteBarn: [],
            kategori: "Nasjonal",
        });

        expect(resultat.success).toBe(false);
        expect(resultat.error?.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: ["motpart", "ident"],
                    message: "Samme person kan ikke være begge parter",
                }),
            ]),
        );
    });

    it.each([
        BarnBeggForeldreSkjemaSchema,
        BarnMedManglendeForeldreSkjemaSchema,
    ])("avviser samme person i begge foreldreroller", (schema) => {
        const resultat = schema.safeParse({
            barn: {
                ident: annenIdent,
                navn: "Barn",
                rolle: "barn_under_18",
            },
            foreldre: [
                {
                    ident,
                    navn: "Første forelder",
                    rolle: "bidragspliktig",
                    erKjent: true,
                },
                {
                    ident,
                    navn: "Andre forelder",
                    rolle: "bidragsmottaker",
                    erKjent: true,
                },
            ],
            kategori: "Nasjonal",
        });

        expect(resultat.success).toBe(false);
        expect(resultat.error?.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: ["foreldre", 1, "ident"],
                    message: "Samme person kan ikke være begge parter",
                }),
            ]),
        );
    });

    it("tillater tom ident for ukjent motpart", () => {
        const resultat = ForelderMedBarnSkjemaSchema.safeParse({
            partISaken: {
                ident,
                navn: "Kjent part",
                rolle: "bidragsmottaker",
                erKjent: true,
            },
            motpart: {
                ident: "",
                navn: "",
                rolle: "bidragspliktig",
                erKjent: false,
            },
            valgteBarn: [],
            kategori: "Nasjonal",
        });

        expect(resultat.success).toBe(true);
    });

    it("bruker samme regel for ektefellebidrag", () => {
        const resultat = EktefellebidragSkjemaSchema.safeParse({
            arbeidsfordeling: "EFS",
            partISaken: {
                ident,
                navn: "Første part",
                rolle: "bidragspliktig",
                erKjent: true,
            },
            motpart: {
                ident,
                navn: "Andre part",
                rolle: "bidragsmottaker",
                erKjent: true,
            },
            kategori: "Nasjonal",
        });

        expect(resultat.success).toBe(false);
        expect(resultat.error?.issues[0]).toEqual(
            expect.objectContaining({
                path: ["motpart", "ident"],
                message: "Samme person kan ikke være begge parter",
            }),
        );
    });
});
