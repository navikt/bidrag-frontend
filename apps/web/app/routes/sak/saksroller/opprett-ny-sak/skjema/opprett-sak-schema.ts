import { z } from "zod";
import {
    type ReellMottakerSkjemaverdi,
    type ReellMottakerValideringsgrunn,
    validerReellMottaker,
} from "../../felles/reell-mottaker/reell-mottaker-regel";
// Samme forretningsregler gjelder for nye og eksisterende saker, så disse gjenbrukes fra
// sakvisning i stedet for å dupliseres.
import { DiskresjonskodeSchema, MAKS_ALDER_BARN, MYNDYG_BARN_ALDER } from "../../felles/sakvisning-schema";

export { DiskresjonskodeSchema, MAKS_ALDER_BARN, MYNDYG_BARN_ALDER };

// ==================== BASE SCHEMAS ====================

const ArbeidsfordelingSchema = z.enum(["BBF", "EEN", "EFS", "FRS", "INH", "OPS"]);
export const PartRolleSchema = z.enum(["bidragspliktig", "bidragsmottaker", "barn_over_18", "barn_under_18"]);
const ForelderPartRolleSchema = z.enum(["bidragspliktig", "bidragsmottaker"]);
const PartISakenSchema = z.object({
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

const MotpartSchema = z.object({
    ident: z.string().optional(),
    navn: z.string().optional(),
    erKjent: z.boolean().optional(),
    rolle: ForelderPartRolleSchema.optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
});

const ForelderPartSchema = MotpartSchema.omit({ rolle: true });
const BarnebidragForelderRolleSchema = ForelderPartSchema.extend({
    type: z.enum(["BP", "BM"]),
});
const EnPartMedBarnRolleSchema = ForelderPartSchema.extend({
    type: z.enum(["BP", "BM"]),
});

/**
 * Samme skjema uansett om saken startes fra en forelder eller fra barnet. Alle parter kan endres.
 * `erKjent` på BP og BM: `undefined` er ikke avklart, `false` er registrert som ukjent.
 * 🔴 Saken kan opprettes uten barn når bidragsmottaker er kjent.
 */
export const BarnebidragSkjemaSchema = z
    .object({
        roller: z.array(BarnebidragForelderRolleSchema),
        valgteBarn: z.array(BarnMedAlderSchema),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        validerForeldre(data, ctx);
        validerBarnebidragBarn(data, ctx);
    });

type BarnebidragSkjemaInput = {
    roller: BarnebidragForelderRolle[];
    valgteBarn: BarnMedAlder[];
};

function validerForeldre(data: BarnebidragSkjemaInput, ctx: z.RefinementCtx) {
    const foreldre = ["BP", "BM"] as const;
    for (const type of foreldre) {
        const rolle = data.roller.find((r) => r.type === type);
        const rolleIndex = data.roller.findIndex((r) => r.type === type);
        const ident = rolle?.ident;
        const erKjent = rolle?.erKjent;
        if (erKjent === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["roller", rolleIndex >= 0 ? rolleIndex : 0, "ident"],
                message: `Du må registrere ${type === "BP" ? "bidragspliktig" : "bidragsmottaker"} eller velge ukjent`,
            });
        }
        if (ident?.trim() && data.valgteBarn.some((barn) => barn.ident === ident)) {
            ctx.addIssue({
                code: "custom",
                path: ["roller", rolleIndex >= 0 ? rolleIndex : 0, "ident"],
                message: "Et barn kan ikke være forelder i saken",
            });
        }
    }
    const bp = data.roller.find((r) => r.type === "BP");
    const bm = data.roller.find((r) => r.type === "BM");
    const bmIndex = data.roller.findIndex((r) => r.type === "BM");
    validateUlikeParter({ ident: bp?.ident ?? "" }, bm ?? {}, ctx, ["roller", bmIndex >= 0 ? bmIndex : 0]);
}

/** Parten er valgt i skjemaet og ikke satt som ukjent. */
export const erKjentPart = (part: ForelderPart) => part.erKjent === true && !!part.ident?.trim();

function validerBarnebidragBarn(data: BarnebidragSkjemaInput, ctx: z.RefinementCtx) {
    const bidragsmottaker = data.roller.find((r) => r.type === "BM");
    if (!erKjentPart(bidragsmottaker ?? {}) && data.valgteBarn.length === 0) {
        ctx.addIssue({ code: "custom", path: ["valgteBarn"], message: "Du må velge minst ett barn." });
    }
    const bidragsmottakerErUkjent = bidragsmottaker?.erKjent === false;
    data.valgteBarn.forEach((barn, index) => {
        const grunn: ReellMottakerValideringsgrunn | null = barn.erMyndig
            ? "myndig-barn"
            : bidragsmottakerErUkjent
              ? "ukjent-bidragsmottaker"
              : null;
        leggTilReellMottakerFeil(barn, grunn, ["valgteBarn", index], ctx);
    });
}

export type BarnebidragSkjemaData = z.infer<typeof BarnebidragSkjemaSchema>;
export type ForelderPart = z.infer<typeof ForelderPartSchema>;
export type BarnebidragForelderRolle = z.infer<typeof BarnebidragForelderRolleSchema>;
export type EnPartMedBarnRolle = z.infer<typeof EnPartMedBarnRolleSchema>;

const createSakMedBarnSkjemaSchema = (
    validateBarn?: (barn: z.infer<typeof BarnMedAlderSchema>, index: number, ctx: z.RefinementCtx) => void,
) =>
    z
        .object({
            arbeidsfordeling: ArbeidsfordelingSchema,
            roller: z.array(EnPartMedBarnRolleSchema),
            valgteBarn: z.array(BarnMedAlderSchema),
            kategori: z.enum(["Nasjonal", "Utland"]),
        })
        .superRefine((data, ctx) => {
            validerEnPartMedBarnRoller(data.roller, ctx);
            if (data.valgteBarn.length === 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["valgteBarn"],
                    message: "Du må velge minst ett barn.",
                });
            }

            data.valgteBarn.forEach((barn, index) => {
                validateBarn?.(barn, index, ctx);
            });
        });

export const OppfostringsbidragSkjemaSchema = createSakMedBarnSkjemaSchema((barn, index, ctx) =>
    leggTilReellMottakerFeil(barn, "alltid", ["valgteBarn", index], ctx),
);
/** Som oppfostringsbidrag, men uten krav om reell mottaker. */
export const FarskapsSkjemaSchema = createSakMedBarnSkjemaSchema();

export type FarskapsSkjemaSchemaData = z.infer<typeof FarskapsSkjemaSchema>;

// ==================== EKTEFELLEBIDRAG FLYT ====================

export const EktefellebidragSkjemaSchema = z
    .object({
        arbeidsfordeling: ArbeidsfordelingSchema,
        roller: z.array(
            z.object({
                ident: z.string(),
                navn: z.string(),
                type: z.enum(["BP", "BM"]),
                erKjent: z.literal(true),
                diskresjonskode: DiskresjonskodeSchema.optional(),
            }),
        ),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        const bp = data.roller.find((rolle) => rolle.type === "BP");
        const bm = data.roller.find((rolle) => rolle.type === "BM");
        const bpIndex = data.roller.findIndex((rolle) => rolle.type === "BP");
        const bmIndex = data.roller.findIndex((rolle) => rolle.type === "BM");
        if (!bp?.ident.trim()) {
            ctx.addIssue({
                code: "custom",
                path: ["roller", bpIndex >= 0 ? bpIndex : 0, "ident"],
                message: "Du må registrere bidragspliktig",
            });
        }
        if (!bm?.ident.trim()) {
            ctx.addIssue({
                code: "custom",
                path: ["roller", bmIndex >= 0 ? bmIndex : 0, "ident"],
                message: "Du må registrere bidragsmottaker",
            });
        }
        if (bp?.ident && bp.ident === bm?.ident) {
            ctx.addIssue({
                code: "custom",
                path: ["roller", bmIndex >= 0 ? bmIndex : 0, "ident"],
                message: "Samme person kan ikke være begge parter",
            });
        }
    });

export type EktefellebidragSkjemaData = z.infer<typeof EktefellebidragSkjemaSchema>;
function validerEnPartMedBarnRoller(roller: EnPartMedBarnRolle[], ctx: z.RefinementCtx) {
    const kjentRolle = roller.find((rolle) => rolle.erKjent === true && rolle.ident?.trim());
    const ikkeValgtRolle = roller.find((rolle) => rolle.erKjent === undefined);
    const manglendeRolle = ikkeValgtRolle ?? (!kjentRolle ? roller[0] : undefined);
    if (manglendeRolle) {
        const indeks = roller.indexOf(manglendeRolle);
        ctx.addIssue({
            code: "custom",
            path: ["roller", indeks, "ident"],
            message: `Du må registrere ${manglendeRolle.type === "BP" ? "bidragspliktig" : "bidragsmottaker"}`,
        });
    }
    const bp = roller.find((rolle) => rolle.type === "BP");
    const bm = roller.find((rolle) => rolle.type === "BM");
    if (bp?.ident?.trim() && bp.ident === bm?.ident) {
        const bmIndex = bm ? roller.indexOf(bm) : 0;
        ctx.addIssue({
            code: "custom",
            path: ["roller", bmIndex, "ident"],
            message: "Samme person kan ikke være begge parter",
        });
    }
}

const validateUlikeParter = (
    partISaken: { ident: string },
    motpart: { ident?: string },
    ctx: z.RefinementCtx,
    felt: string | (string | number)[] = "motpart",
) => {
    if (motpart.ident?.trim() && partISaken.ident === motpart.ident) {
        ctx.addIssue({
            code: "custom",
            path: [...(Array.isArray(felt) ? felt : [felt]), "ident"],
            message: "Samme person kan ikke være begge parter",
        });
    }
};

function leggTilReellMottakerFeil(
    verdi: ReellMottakerSkjemaverdi,
    grunn: ReellMottakerValideringsgrunn | null,
    basePath: Array<string | number>,
    ctx: z.RefinementCtx,
) {
    validerReellMottaker(verdi, grunn).forEach((feil) => {
        ctx.addIssue({
            code: "custom",
            path: [...basePath, feil.felt],
            message: feil.melding,
        });
    });
}

// ==================== EXPORTED TYPES ====================

export type BarnMedAlder = z.infer<typeof BarnMedAlderSchema>;
export type Motpart = z.infer<typeof MotpartSchema>;
export type PartISaken = z.infer<typeof PartISakenSchema>;
export type PartRolle = z.infer<typeof PartRolleSchema>;
export type ForelderPartRolle = z.infer<typeof ForelderPartRolleSchema>;
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
