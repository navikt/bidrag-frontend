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

/**
 * Samme skjema uansett om saken startes fra en forelder eller fra barnet. Alle parter kan endres.
 * `erKjent` på BP og BM: `undefined` er ikke avklart, `false` er registrert som ukjent.
 * 🔴 Saken kan opprettes uten barn når bidragsmottaker er kjent.
 */
export const BarnebidragSkjemaSchema = z
    .object({
        bidragspliktig: ForelderPartSchema,
        bidragsmottaker: ForelderPartSchema,
        valgteBarn: z.array(BarnMedAlderSchema),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        validerForeldre(data, ctx);
        validerBarnebidragBarn(data, ctx);
    });

type BarnebidragSkjemaInput = {
    bidragspliktig: ForelderPart;
    bidragsmottaker: ForelderPart;
    valgteBarn: BarnMedAlder[];
};

function validerForeldre(data: BarnebidragSkjemaInput, ctx: z.RefinementCtx) {
    for (const felt of ["bidragspliktig", "bidragsmottaker"] as const) {
        const { ident, erKjent } = data[felt];
        if (erKjent === undefined) {
            ctx.addIssue({
                code: "custom",
                path: [felt, "ident"],
                message: `Du må registrere ${felt} eller velge ukjent`,
            });
        }
        if (ident?.trim() && data.valgteBarn.some((barn) => barn.ident === ident)) {
            ctx.addIssue({ code: "custom", path: [felt, "ident"], message: "Et barn kan ikke være forelder i saken" });
        }
    }
    validateUlikeParter({ ident: data.bidragspliktig.ident ?? "" }, data.bidragsmottaker, ctx, "bidragsmottaker");
}

/** Parten er valgt i skjemaet og ikke satt som ukjent. */
export const erKjentPart = (part: ForelderPart) => part.erKjent === true && !!part.ident?.trim();

function validerBarnebidragBarn(data: BarnebidragSkjemaInput, ctx: z.RefinementCtx) {
    if (!erKjentPart(data.bidragsmottaker) && data.valgteBarn.length === 0) {
        ctx.addIssue({ code: "custom", path: ["valgteBarn"], message: "Du må velge minst ett barn." });
    }
    const bidragsmottakerErUkjent = data.bidragsmottaker.erKjent === false;
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

const createSakMedBarnSkjemaSchema = (
    validateBarn?: (barn: z.infer<typeof BarnMedAlderSchema>, index: number, ctx: z.RefinementCtx) => void,
) =>
    z
        .object({
            arbeidsfordeling: ArbeidsfordelingSchema,
            partISaken: PartISakenSchema,
            valgteBarn: z.array(BarnMedAlderSchema),
            motpart: MotpartSchema,
            kategori: z.enum(["Nasjonal", "Utland"]),
        })
        .superRefine((data, ctx) => {
            validateParterOgBarn(data, true, ctx);

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
        validerPartISaken(data.partISaken, ctx);
        validateUlikeParter(data.partISaken, data.motpart, ctx);
    });

export type EktefellebidragSkjemaData = z.infer<typeof EktefellebidragSkjemaSchema>;
const validateParterOgBarn = (
    data: { partISaken: { ident: string; rolle: string }; motpart: { ident?: string }; valgteBarn: unknown[] },
    kreverBarn: boolean,
    ctx: z.RefinementCtx,
) => {
    validerPartISaken(data.partISaken, ctx);
    validateUlikeParter(data.partISaken, data.motpart, ctx);
    if (kreverBarn && data.valgteBarn.length === 0) {
        ctx.addIssue({
            code: "custom",
            path: ["valgteBarn"],
            message: "Du må velge minst ett barn.",
        });
    }
};

function validerPartISaken(partISaken: { ident: string; rolle: string }, ctx: z.RefinementCtx) {
    if (!partISaken.ident.trim()) {
        ctx.addIssue({
            code: "custom",
            path: ["partISaken", "ident"],
            message: `Du må registrere ${partISaken.rolle}`,
        });
    }
}

const validateUlikeParter = (
    partISaken: { ident: string },
    motpart: { ident?: string },
    ctx: z.RefinementCtx,
    felt = "motpart",
) => {
    if (motpart.ident?.trim() && partISaken.ident === motpart.ident) {
        ctx.addIssue({
            code: "custom",
            path: [felt, "ident"],
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
