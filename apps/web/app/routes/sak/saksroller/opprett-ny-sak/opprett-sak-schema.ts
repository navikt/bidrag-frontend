import { z } from "zod";

// Samme forretningsregler gjelder for nye og eksisterende saker, så disse gjenbrukes fra
// sakvisning i stedet for å dupliseres.
import { DiskresjonskodeSchema, MYNDYG_BARN_ALDER } from "../sakvisning-schema";

export { DiskresjonskodeSchema, MYNDYG_BARN_ALDER };

// ==================== BASE SCHEMAS ====================

export const MAKS_ALDER_BARN = 24;

export const ArbeidsfordelingSchema = z.enum(["BBF", "EEN", "EFS", "FRS", "INH", "OPS"]);
export const RolleForOpprettSakSchema = z.enum(["BA", "BM", "BP", "FR", "RM"]);
export const PartRolleSchema = z.enum(["bidragspliktig", "bidragsmottaker", "barn_over_18", "barn_under_18"]);
export const ForelderPartRolleSchema = z.enum(["bidragspliktig", "bidragsmottaker"]);
export const PartISakenSchema = z.object({
    ident: z.string(),
    navn: z.string(),
    rolle: PartRolleSchema,
    diskresjonskode: DiskresjonskodeSchema.optional(),
    erKjent: z.boolean().optional(),
});

export const BarnMedAlderSchema = z.object({
    ident: z.string().length(11, "Fødselsnummer må være 11 siffer"),
    navn: z.string().min(1, "Navn er påkrevd"),
    fødselsdato: z.string().optional(),
    alder: z.number().min(0).max(130),
    erMyndig: z.boolean(),
    // Reell mottaker (kun for 18+ eller ukjent motpart)
    reellMottakerType: z.enum(["ingen", "barnet_selv", "annen_person"]).optional().nullable(),
    reellMottaker: z.string().optional(),
    reellMottakerNavn: z.string().optional(),
    manuellLagtTil: z.boolean().optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
});

export const MotpartSchema = z.object({
    ident: z.string().optional(),
    navn: z.string().optional(),
    erKjent: z.boolean().optional(),
    rolle: ForelderPartRolleSchema.optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
});

// ==================== FORELDER SCHEMAS (MERGED) ====================

const createForelderSkjemaSchema = () =>
    z
        .object({
            partISaken: PartISakenSchema,
            valgteBarn: z.array(BarnMedAlderSchema),
            motpart: MotpartSchema,
            kategori: z.enum(["Nasjonal", "Utland"]),
        })
        .superRefine((data, ctx) => {
            if (data.partISaken.rolle === "bidragspliktig" && data.valgteBarn.length === 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["valgteBarn"],
                    message: "Du må velge minst ett barn.",
                });
            }

            const bidragsmottaker = data.partISaken.rolle === "bidragsmottaker" ? data.partISaken : data.motpart;
            const bidragsmottakerErUkjent = typeof bidragsmottaker?.erKjent === "boolean" && !bidragsmottaker?.erKjent;

            data.valgteBarn.forEach((barn, index) => {
                const trengerReellMottaker = barn.erMyndig || bidragsmottakerErUkjent;

                if (trengerReellMottaker) {
                    if (!barn.reellMottakerType || barn.reellMottakerType === "ingen") {
                        ctx.addIssue({
                            code: "custom",
                            path: ["valgteBarn", index, "reellMottakerType"],
                            message: barn.erMyndig
                                ? "Reell mottaker må registreres for barn over 18 år"
                                : "Reell mottaker må registreres når bidragsmottaker er ukjent",
                        });
                    }

                    if (barn.reellMottakerType === "annen_person") {
                        if (!barn.reellMottaker || barn.reellMottaker.trim() === "") {
                            ctx.addIssue({
                                code: "custom",
                                path: ["valgteBarn", index, "reellMottaker"],
                                message: "Du må registrere reell mottaker",
                            });
                        }
                    }
                }
                // Barn under 18 trenger IKKE reell mottaker (uansett om BM er ukjent)
            });
        });

export const ForelderMedBarnSkjemaSchema = createForelderSkjemaSchema();
export const ForelderUtenBarnSkjemaSchema = createForelderSkjemaSchema();

export type ForelderMedBarnSkjemaData = z.infer<typeof ForelderMedBarnSkjemaSchema>;
export type ForelderUtenBarnSkjemaData = z.infer<typeof ForelderUtenBarnSkjemaSchema>;

// ==================== BARN BEGGE FORELDRE FLYT ====================

export const ForelderMedRolleSchema = z.object({
    ident: z.string(),
    navn: z.string(),
    rolle: ForelderPartRolleSchema.nullable(),
    erKjent: z.boolean().optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
});

export const BarnMedReellMottakerSchema = z.object({
    ident: z.string(),
    navn: z.string(),
    rolle: PartRolleSchema,
    // Reell mottaker (kun for barn over 18)
    reellMottakerType: z.enum(["ingen", "barnet_selv", "annen_person"]).optional().nullable(),
    reellMottaker: z.string().optional(),
    reellMottakerNavn: z.string().optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
});
export const OppfostringsbidragSkjemaSchema = z
    .object({
        arbeidsfordeling: ArbeidsfordelingSchema,
        partISaken: PartISakenSchema,
        valgteBarn: z.array(BarnMedAlderSchema),
        motpart: MotpartSchema,
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        if (data.valgteBarn.length === 0) {
            ctx.addIssue({
                code: "custom",
                path: ["valgteBarn"],
                message: "Du må velge minst ett barn.",
            });
        }

        // For oppfostringsbidrag: ALLE barn må ha reellMottaker valgt (uavhengig av alder)
        data.valgteBarn.forEach((barn, index) => {
            if (!barn.reellMottakerType || barn.reellMottakerType === "ingen") {
                ctx.addIssue({
                    code: "custom",
                    path: ["valgteBarn", index, "reellMottakerType"],
                    message: "Reell mottaker må registreres for hvert barn",
                });
            }

            if (barn.reellMottakerType === "annen_person") {
                if (!barn.reellMottaker || barn.reellMottaker.trim() === "") {
                    ctx.addIssue({
                        code: "custom",
                        path: ["valgteBarn", index, "reellMottaker"],
                        message: "Du må registrere reell mottaker",
                    });
                }
            }
        });
    });
// ==================== FARSKAP SCHEMA ====================
// Similar to OPPFOSTRINGSBIDRAG but does NOT require reellMottaker selection
export const FarskapsSkjemaSchema = z
    .object({
        arbeidsfordeling: ArbeidsfordelingSchema,
        partISaken: PartISakenSchema,
        valgteBarn: z.array(BarnMedAlderSchema),
        motpart: MotpartSchema,
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        if (data.valgteBarn.length === 0) {
            ctx.addIssue({
                code: "custom",
                path: ["valgteBarn"],
                message: "Du må velge minst ett barn.",
            });
        }
        // For farskap: reellMottaker is NOT required
    });

export type FarskapsSkjemaSchemaData = z.infer<typeof FarskapsSkjemaSchema>;

export const BarnBeggForeldreSkjemaSchema = z
    .object({
        barn: BarnMedReellMottakerSchema,
        foreldre: z.array(ForelderMedRolleSchema).length(2, "Det må være nøyaktig 2 foreldre"),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        validateForeldreHarRoller(data.foreldre, ctx);
        validateRollerErForskjellige(data.foreldre, ctx);
        const bidragsmottaker = data.foreldre.find((forelder) => forelder.rolle === "bidragsmottaker");
        const bidragsmottakerErUkjent = typeof bidragsmottaker?.erKjent === "boolean" && !bidragsmottaker?.erKjent;
        validateReellMottakerForBarn(data.barn, bidragsmottakerErUkjent, ctx);
    });

export type OppfostringsbidragSkjemaSchemaData = z.infer<typeof OppfostringsbidragSkjemaSchema>;
export type BarnBeggForeldreSkjemaData = z.infer<typeof BarnBeggForeldreSkjemaSchema>;
export type ForelderMedRolle = z.infer<typeof ForelderMedRolleSchema>;
export type BarnMedReellMottaker = z.infer<typeof BarnMedReellMottakerSchema>;

// ==================== BARN MANGLENDE FORELDRE FLYT ====================

export const BarnMedManglendeForeldreSkjemaSchema = z
    .object({
        barn: BarnMedReellMottakerSchema,
        foreldre: z.array(ForelderMedRolleSchema).length(2, "Det må være nøyaktig 2 foreldre"),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        validateForeldreHarRoller(data.foreldre, ctx);
        validateRollerErForskjellige(data.foreldre, ctx);
        const bidragsmottaker = data.foreldre.find((forelder) => forelder.rolle === "bidragsmottaker");
        const bidragsmottakerErUkjent = typeof bidragsmottaker?.erKjent === "boolean" && !bidragsmottaker?.erKjent;
        validateReellMottakerForBarn(data.barn, bidragsmottakerErUkjent, ctx);
    });

export type BarnMedManglendeForeldreSkjemaData = z.infer<typeof BarnMedManglendeForeldreSkjemaSchema>;

// ==================== EKTEFELLEBIDRAG FLYT ====================

export const EktefellebidragSkjemaSchema = z
    .object({
        arbeidsfordeling: ArbeidsfordelingSchema,
        partISaken: PartISakenSchema,
        motpart: z.object({
            ident: z.string().min(11, "Du må registrere ektefelle/samboer"),
            navn: z.string(),
            rolle: ForelderPartRolleSchema,
            erKjent: z.literal(true), // Alltid true for ektefellebidrag
            diskresjonskode: DiskresjonskodeSchema.optional(),
        }),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        if (data.partISaken.ident === data.motpart.ident) {
            ctx.addIssue({
                code: "custom",
                path: ["motpart", "ident"],
                message: "Partene kan ikke være samme person",
            });
        }
    });

export type EktefellebidragSkjemaData = z.infer<typeof EktefellebidragSkjemaSchema>;
const validateForeldreHarRoller = (foreldre: ForelderMedRolle[], ctx: z.RefinementCtx) => {
    foreldre.forEach((forelder, index) => {
        const erRegistrertSomUkjent = forelder.erKjent === false;

        if (!erRegistrertSomUkjent && forelder.navn.trim() === "") {
            ctx.addIssue({
                code: "custom",
                path: ["foreldre", index],
                message: "Du må registrere denne forelderen",
            });
            return;
        }

        if (!forelder.rolle) {
            ctx.addIssue({
                code: "custom",
                path: ["foreldre", index, "rolle"],
                message: "Du må velge rolle for denne forelderen",
            });
        }
    });
};

const validateRollerErForskjellige = (foreldre: ForelderMedRolle[], ctx: z.RefinementCtx) => {
    const roller = foreldre.map((f) => f.rolle).filter((r) => r !== null);
    if (roller.length === 2 && roller[0] === roller[1]) {
        ctx.addIssue({
            code: "custom",
            path: ["foreldre"],
            message: "Foreldrene kan ikke ha samme rolle",
        });
    }
};

/**
 * Validerer reell mottaker for barn over 18 eller ved ukjent bidragsmottaker
 */
const validateReellMottakerForBarn = (
    barn: BarnMedReellMottaker,
    bidragsmottakerErUkjent: boolean,
    ctx: z.RefinementCtx,
) => {
    const trengerReellMottaker = barn.rolle === "barn_over_18" || bidragsmottakerErUkjent;

    if (!trengerReellMottaker) {
        return;
    }

    if (!barn.reellMottakerType || barn.reellMottakerType === "ingen") {
        ctx.addIssue({
            code: "custom",
            path: ["barn", "reellMottakerType"],
            message:
                barn.rolle === "barn_over_18"
                    ? "Reell mottaker må registreres for barn over 18 år"
                    : "Reell mottaker må registreres når bidragsmottaker er ukjent",
        });
    }

    if (barn.reellMottakerType === "annen_person") {
        if (!barn.reellMottaker || barn.reellMottaker.trim() === "") {
            ctx.addIssue({
                code: "custom",
                path: ["barn", "reellMottaker"],
                message: "Du må registrere reell mottaker",
            });
        }
    }
};

// ==================== EXPORTED TYPES ====================

export type BarnMedAlder = z.infer<typeof BarnMedAlderSchema>;
export type Motpart = z.infer<typeof MotpartSchema>;
export type PartISaken = z.infer<typeof PartISakenSchema>;
export type PartRolle = z.infer<typeof PartRolleSchema>;
export type ForelderPartRolle = z.infer<typeof ForelderPartRolleSchema>;
export type RolleForOpprettSak = z.infer<typeof RolleForOpprettSakSchema>;
export type Diskresjonskode = z.infer<typeof DiskresjonskodeSchema>;

// ==================== HELPER TYPES ====================

export type Barnkurv = {
    id: string; // motpart.ident eller "UKJENT"
    motpart: {
        ident: string;
        visningsnavn: string;
        fødselsdato: string;
        diskresjonskode?: Diskresjonskode;
    } | null;
    forelderrolle:
        | "BARN"
        | "FAR"
        | "MEDMOR"
        | "MOR"
        | "INGEN"
        | "FORELDER"
        | "EKTEFELLE"
        | "MOTPART_TIL_FELLES_BARN"
        | "UKJENT"
        | null;
    barn: BarnMedAlder[];
};

export type ForeslåttMotpart = {
    ident: string;
    navn: string;
    fødselsdato: string;
};
